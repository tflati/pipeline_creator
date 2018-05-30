from django.shortcuts import render
from django.http import HttpResponse
import json
import os
import time
import glob
import datetime
import stat
import shutil
import subprocess
import networkx as nx
import openpyxl as opx

from collections import Counter

from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings

import zipfile

from Bio import Entrez
from lxml import etree

def test(request):
    pass

def init_ncbi_tools():
    Entrez.email = "tiziano.flati@gmail.com"
    Entrez.api_key = "ae48c58f9a840e56ee71d28cb464cc988408"

def upload_samples(request):
    print(request)
    print(request.FILES)
    samples_set = set()
    for file in request.FILES.values():
        filepath = os.path.dirname(__file__) + "/temp/" + file.name
        default_storage.save(filepath, ContentFile(file.read()))
        wbook = opx.load_workbook(filepath, read_only=True)
        for wsheet in wbook.worksheets:
            for row in wsheet.iter_rows():
                for cell in row:
                    if cell.value is not None and isinstance(cell.value, str) and (cell.value.startswith("SRR") or cell.value.startswith("ERR") or cell.value.startswith("DRR")):
                        samples_set.add(cell.value)
    samples = list(samples_set)
                        
    print("{} samples found ({} unique)".format(len(samples_set), len(samples)))
    
    init_ncbi_tools()
    
    handle = Entrez.esearch(retmax=1000, db="sra", term=' OR '.join(samples))
    try:
        record = Entrez.read(handle)
    except RuntimeError as e:
        return HttpResponse(json.dumps({"message": str(e)}))
        
    handle.close()
    print(record)
    ids = record["IdList"]
    
    print("{}/{} IDS returned".format(len(ids), len(samples)))
    
    handle2 = Entrez.efetch(db="sra", id=','.join(ids))
    record = handle2.read()
    handle2.close()
    
    sra_filepath = os.path.dirname(__file__) + "/temp/sra.xml"
    default_storage.save(sra_filepath, ContentFile(record))
    
    tree = etree.fromstring(record)
    
    response = convert_ncbi_response(samples_set, tree)

    return HttpResponse(json.dumps(response))

def convert_ncbi_response(samples_set, tree):
    
    response = []
    
    # for each bioproject
    for project_elem in tree.iter("EXPERIMENT_PACKAGE"):
        layout_elem = project_elem.find(".//LIBRARY_LAYOUT")
        layout = layout_elem[0].tag
        
        print("LAYOUT=", layout)
        experiment_id = project_elem.findtext(".//EXPERIMENT//IDENTIFIERS//PRIMARY_ID")
        bioproject_id = project_elem.findtext(".//STUDY//EXTERNAL_ID[@namespace='BioProject']")
        organism = project_elem.find(".//Pool//Member").attrib["organism"]
        print("BIOPROJECT_ID=", experiment_id, organism)
        
        attributes = {}
        for attribute in project_elem.iter("SAMPLE_ATTRIBUTE"):
            tag = attribute.findtext("TAG")
            value = attribute.findtext("VALUE")
            print("SAMPLE ATTRIBUTE", tag, value)
            attributes[tag] = value
        
        # for each run in the bioproject
        selected_run_ids = []
        total_size = 0
        for run_elem in project_elem.iter("RUN"):
            size = int(run_elem.attrib["size"])
            run_id = run_elem.findtext(".//PRIMARY_ID")
            print("\t", "RUN_ID=", run_id)
            print("\t", "SIZE=", size)
            if samples_set and run_id not in samples_set: continue
            selected_run_ids.append(run_id)
            total_size += size
        
        platform = project_elem.findtext(".//PLATFORM//INSTRUMENT_MODEL")
        study_title = project_elem.findtext(".//STUDY_TITLE")
        study_type = project_elem.find(".//STUDY_TYPE").attrib["existing_study_type"]
        study_abstract = project_elem.findtext(".//STUDY_ABSTRACT")
        
        paper_id = None
        for el in project_elem.iterfind(".//STUDY_LINK//XREF_LINK"):
            if el.findtext(".//DB") == "pubmed":
                paper_id = el.findtext(".//ID")
                
        print("paper_id", paper_id)
        
        tags = []
        
        tags.append({
            "name": platform,
            "type": "Platform"
        })
        
        tags.append({
            "name": "PE" if layout == "PAIRED"  else "SE",
            "type": "Layout"
        })
        
        if organism and organism is not None:
            tags.append({
                "name": organism,
                "type": "Organism"
            })
        
        biosample_id = project_elem.findtext(".//SAMPLE//IDENTIFIERS//EXTERNAL_ID[@namespace=\"BioSample\"]")
        
        bioproject_data = {
            "dataset": {
                "id": experiment_id,
                "size": total_size,
                "bioproject_id": bioproject_id,
                "platform": platform,
                "pairedend": layout == "PAIRED",
                "sample_ids": "\n".join(selected_run_ids),
                "attributes": attributes,
                "biosample_id": biosample_id,
                "tags": tags,
                "study": {
                        "title": study_title,
                        "type": study_type,
                        "abstract": study_abstract
                    }
                }
            }
        
        if organism and organism is not None:
            bioproject_data["dataset"]["genome"] = organism
            
        if paper_id and paper_id is not None:  
            bioproject_data["dataset"]["paper_id"] = paper_id
            
        response.append(bioproject_data)
        
    return response

def create_projects(request):
    
    print(request)
    print(request.body.decode("utf-8"))
    
    data = json.loads(request.body.decode("utf-8"))
    print(data)
                        
    init_ncbi_tools()
    
    samples = data["list"].split("\n")
    
    samples_set = set()
    if samples and samples[0].startswith("SRR"):
        samples_set = set(samples)
    
    handle = Entrez.esearch(retmax=1000, db="sra", term=' OR '.join(samples))
    try:
        record = Entrez.read(handle)
    except RuntimeError as e:
        return HttpResponse(json.dumps({"message": str(e)}))
        
    handle.close()
    print(record)
    ids = record["IdList"]
    
    print("{}/{} IDS returned".format(len(ids), len(samples)))
    
    handle2 = Entrez.efetch(db="sra", id=','.join(ids))
    record = handle2.read()
    handle2.close()
    
    sra_filepath = os.path.dirname(__file__) + "/temp/sra.xml"
    default_storage.save(sra_filepath, ContentFile(record))
    
    tree = etree.fromstring(record)
    
    response = convert_ncbi_response(samples_set, tree)

    return HttpResponse(json.dumps(response))

def single_step_allsamples_writer(step, file, vertex2name, dataset, pipeline, g, u):
    
    #sample_variable = dataset["sample_variable"]
    sample_variable = next(filter(lambda x: x['key'] == "sample_variable", pipeline["variables"]))["value"]
    
    sh_file = step["title"]+".sh"
        
    file.write("##########################\n######  {}  ########\n##########################\n".format(step["title"]))
    
    file.write("execute=1\n")
    
    # Add the run-time conditions to check before launching the command
    conditions = step["conditions"]
    if conditions:
        for condition in conditions:
            
            file.write(
"""
# Checking skip conditions
execute=0
for {} in `cat "dataset.txt"`
do
    {}
    step_condition=$?
    echo "{}"
    echo {} ${} $step_condition
    if [ "$step_condition" -eq 1 ]
    then
        execute=1
        break
    fi
done

""".format(sample_variable, condition["command"], condition["command"], step["title"], sample_variable))

    # TODO - clearer: eventually write explicit variables called like: trimmomatic_job_long_name and concatenate
    # these to form the depend=afterany string
    file.write("DEPS=()\n")
    for dep in g.predecessors(u):
        dep_name = vertex2name[dep]
        if dep_name == "ROOT": continue
        
        dep_script = """
DEP_JOB_NAME="{}"
echo "DEP JOB NAME="$DEP_JOB_NAME
DEP_JOB_ID=${{JOB_IDS["$DEP_JOB_NAME"]}}
echo "DEPJOBID="$DEP_JOB_ID

if [ ! -z $DEP_JOB_ID ]
then
    DEPS+=($DEP_JOB_ID)
fi """.format(dep_name)
                
        file.write(dep_script)
            
    script = """
sh_file="{}"
echo $sh_file "execute="$execute
if [ $execute -eq 1 ]
then
    echo "DEPENDENCIES($sh_file)=" ${{DEPS[@]}}
    set -o xtrace
    if [[ ! -z "$DEPS" ]]
    then
        job_long_name=$(sbatch --depend=afterany$(printf ":%s" "${{DEPS[@]}}") ./"$sh_file")
    else
        job_long_name=$(sbatch ./"$sh_file")
    fi
    
    job_id=$(echo $job_long_name | cut -d' ' -f4)
    echo "$sh_file => $job_id"
    JOB_IDS["{}"]=$job_id
    
    set +o xtrace
else
    echo "Skipping $sh_file file"
fi
""".format(sh_file, step["title"])
        
    file.write(script)
    
def single_step_singlesample_writer(step, file, vertex2name, dataset, pipeline, g, u):
    
    #sample_variable = dataset["sample_variable"]
    sample_variable = next(filter(lambda x: x['key'] == "sample_variable", pipeline["variables"]))["value"]
    
    for sample in dataset["sample_ids"].split("\n"):
        v_name = vertex2name[u]
        name = step["title"] + "-" + sample
        if v_name != name: continue
        
        sh_file = name + ".sh"
        
        file.write("\n\n\n##########################\n######  {}  ########\n##########################\n".format(name))
    
        file.write("execute=1\n")
    
        # Add the run-time conditions to check before launching the command
        conditions = step["conditions"]
        if conditions:
            for condition in conditions:
                command = condition["command"]
                command = command.replace("${}".format(sample_variable), sample)
                command = command.replace("${{{}}}".format(sample_variable), sample)
                    
                file.write(
"""
# Checking skip conditions
execute=0
{}
step_condition=$?
echo "{}"
echo {} {} $step_condition
if [ "$step_condition" -eq 1 ]
then
    execute=1
fi

""".format(command, command, name, sample))

        # TODO - clearer: eventually write explicit variables called like: trimmomatic_job_long_name and concatenate
        # these to form the depend=afterany string
        file.write("DEPS=()\n")
        for dep in g.predecessors(u):
            dep_name = vertex2name[dep]
            if dep_name == "ROOT": continue
            
            dep_script = """
DEP_JOB_NAME="{}"
echo "DEP JOB NAME="$DEP_JOB_NAME
DEP_JOB_ID=${{JOB_IDS["$DEP_JOB_NAME"]}}
echo "DEPJOBID="$DEP_JOB_ID

if [ ! -z $DEP_JOB_ID ]
then
    DEPS+=($DEP_JOB_ID)
fi

""".format(dep_name)
                
            file.write(dep_script)
            
        script = """
sh_file="{}"
echo $sh_file "execute="$execute
if [ $execute -eq 1 ]
then
    echo "DEPENDENCIES($sh_file)=" ${{DEPS[@]}}
    set -o xtrace
    if [[ ! -z "$DEPS" ]]
    then
        job_long_name=$(sbatch --depend=afterany$(printf ":%s" "${{DEPS[@]}}") ./"$sh_file")
    else
        job_long_name=$(sbatch ./"$sh_file")
    fi
    
    job_id=$(echo $job_long_name | cut -d' ' -f4)
    echo "$sh_file => $job_id"
    JOB_IDS["{}"]=$job_id
    
    set +o xtrace
else
    echo "Skipping $sh_file file"
fi
""".format(sh_file, name)

        file.write(script)

def modules(request, cluster_id, prefix = None):
    modules = {}

    last_module = ""
    last_category = ""
    
    for line in open(os.path.dirname(__file__) + "/utils/all_modules_" + cluster_id + ".txt"):
        line = line.rstrip()
        
        initial_tabs = len(line)-len(line.lstrip('\t'))
        if initial_tabs == 0:
            if line.startswith("Profile: "):
                line = line.replace("Profile: ", "")
                if prefix is None or prefix.lower() in line.lower() or prefix.lower() in "profile":
                    modules[line] = {"label": "profile/"+line}
                
        elif initial_tabs == 2:
            line = line.lstrip()
            last_category = line
            
        elif initial_tabs == 3:
            line = line.strip("\t")
            if not line.startswith(" "): last_module = line
            elif prefix is None or prefix.lower() in last_module.lower():
                modules[last_category+"#"+last_module + "/" +line.strip()] = {"label": last_module + "/" +line.strip(), "extra": last_category}
    return HttpResponse(json.dumps(list(modules.values())))

def genomes(request, cluster_id):
    
    print("ASKED GENOMES OF", cluster_id)
    
    genomes = []

    last_module = ""
    last_category = ""
    
    for line in open(os.path.dirname(__file__) + "/utils/all_modules_"+cluster_id+".txt"):
        line = line.rstrip()
        
        initial_tabs = len(line)-len(line.lstrip('\t'))
        
        if initial_tabs == 2:
            line = line.lstrip()
            last_category = line
            
        if initial_tabs == 3:
            line = line.strip("\t")
            if not line.startswith(" "): last_module = line
            elif last_category == "data":
                
                genome = {
                    "id": last_module + "/" +line.strip(),
                    "img": "imgs/genomes/genome.png"
                }
                
                if genome["id"] == "ig_Mus_musculus/mm10":
                    genome["organism"] = "Topo"
                    genome["img"] = "imgs/genomes/mus_musculus.png"
                    
                elif genome["id"] == "ig_Mus_musculus/mm9":
                    genome["organism"] = "Topo"
                    genome["img"] = "imgs/genomes/mus_musculus.png"
                    
                elif genome["id"] == "ig_Rattus_norvegicus/rn6":
                    genome["organism"] = "Ratto"
                    genome["img"] = "imgs/genomes/rattus.png"
                    
                elif genome["id"].lower().startswith("ig_homo_") or genome["id"].lower().startswith("homo_"):
                    genome["organism"] = "Uomo"
                    genome["img"] = "imgs/genomes/homo_sapiens.png"
                
                name, version = genome["id"].split("/")
                name = name.replace("ig_", "").replace("_", " ")
                genome["name"] = name.capitalize() + " ("+ version + ")"
                
                genomes.append(genome)
    
    return HttpResponse(json.dumps(genomes))

def projects(request):
    projects = []
    for file in glob.glob(os.path.dirname(__file__) + "/data/*.json"):
        projects.append(json.load(open(file)))
        
    return HttpResponse(json.dumps(projects))

def load_project(request, project_id):
    filepath = os.path.dirname(__file__) + "/data/"+project_id+".json"
    if os.path.exists(filepath):
        return HttpResponse(json.dumps(json.load(open(filepath))))
    else:
        return HttpResponse()
    
def save_project(request):
    data = json.loads(request.body.decode('utf-8'))
    
    project_id = data["id"]
    filepath = os.path.dirname(__file__) + "/data/"+project_id+".json"
    open(filepath, "w").write(json.dumps(data, indent=4, sort_keys=True))
    
    for group in data["projects"]:
        print(group["dataset"]["id"], group["dataset"]["pipeline"])
    
    return HttpResponse("Project: '{}' correctly saved.".format(project_id))

def delete_project(request):
    data = json.loads(request.body.decode('utf-8'))
    project_id = data["id"]
    filepath = os.path.dirname(__file__) + "/data/"+project_id+".json"
    os.remove(filepath)
    
    return HttpResponse("Project: '{}' correctly removed.".format(project_id))

# def rename_project(request):
#     data = json.loads(request.body.decode('utf-8'))
#     
#     project_id = data["id"]
#     new_project_id = data["extra"]
#     filepath = os.path.dirname(__file__) + "/data/"+project_id+".json"
#     newfilepath = os.path.dirname(__file__) + "/data/"+new_project_id+".json"
#     os.rename(filepath, newfilepath)
#     
#     return HttpResponse("Project: '{}' correctly renamed as '{}'.".format(project_id, new_project_id))

def tags_compatibles(g1, g2):
    compatible = True
    
    for tag2 in g2:
        tag2_compatible = False
        for tag1 in g1:
            if tag1["name"] == tag2["name"] and tag1["type"] == tag2["type"]:
                tag2_compatible = True
                break
         
        if not tag2_compatible:
            compatible = False
            break
    
    return compatible

def produce_scripts(request):
    project = json.loads(request.body.decode('utf-8'))
    
#     print(project)
    
    # Create project base dir
    script_dir = os.path.dirname(__file__) + "/scripts/" + project["id"]
    if not os.path.exists(script_dir):
        os.makedirs(script_dir)
    
#     pipelines = project["pipelines"]
#     for pipeline in project["pipelines"]: pipelines[pipeline["id"]] = pipeline
    
    for subproject in project["projects"]:
        if "disabled" in subproject and subproject["disabled"] == True: continue
        
        dataset = subproject["dataset"]
        subproject_id = dataset["id"]
        
        # Automatically find the pipeline which best suits this subproject
        pipeline = None
        compatible_pipelines = []
        for pipe in project["pipelines"]:
            if pipe == dataset["pipeline"]:
                pipeline = pipe
                break
            
            print(dataset["tags"], pipe["tags"])
            if tags_compatibles(dataset["tags"], pipe["tags"]):
                compatible_pipelines.append(pipe)
                
        if len(compatible_pipelines) == 0:
            print("[WARNING] No compatible pipeline found for this subproject={}".format(dataset["id"]))
        pipeline = compatible_pipelines[0]
        if len(compatible_pipelines) > 1:
            print("[WARNING] More than 1 compatible pipeline found ({} found) for this subproject={}".format(len(compatible_pipelines), dataset["id"]))
        
        # Create project base dir
        subproject_dir = script_dir + "/" + subproject_id
        if not os.path.exists(subproject_dir):
            os.makedirs(subproject_dir)
        
        # Create a file with all the sample ids
        dataset_writer = open(subproject_dir + "/dataset.txt", "w")
        for sample in dataset["sample_ids"].split("\n"):
            dataset_writer.write(sample + "\n")
        dataset_writer.close()
        
        # Generate single scripts (per-sample or per-step)
        for step in pipeline["steps"]:
            if step["skip"]: continue
            
            if step["type"] == "per-step":
                create_step_all_samples(subproject_id, subproject_dir, step, dataset, pipeline)
            elif step["type"] == "per-sample":
                create_allsteps_single_sample(subproject_id, subproject_dir, step, dataset, pipeline)
        
        # Initial graph setup
        g = nx.DiGraph()
        name2vertex = {}
        vertexname2step = {}
        stepname2step = {}
        vertex2name = {}
        for step in pipeline["steps"]:
            stepname2step[step["title"]] = step
            
            if step["type"] == "per-step":
                name = step["title"]
                v = name
                g.add_node(v)
                name2vertex[name] = v
                vertex2name[v] = name
                vertexname2step[name] = step
                
            elif step["type"] == "per-sample":
                for sample in dataset["sample_ids"].split("\n"):
                    name = step["title"] + "-" + sample
                    v = name
                    g.add_node(v)
                    name2vertex[name] = v
                    vertex2name[v] = name
                    vertexname2step[name] = step
        
        for step in pipeline["steps"]:
            if step["type"] == "per-step":
                name = step["title"]
                v = name2vertex[name]
                for dep in step["hpc_directives"]["dependencies"]:
                    dep_step = stepname2step[dep]
                    if dep_step["skip"]: continue
                    
                    # 1 -> 1
                    if dep_step["type"] == "per-step":
                        name = dep_step["title"]
                        u = name2vertex[name]
                        g.add_edge(u, v)
                    
                    # molti -> 1     
                    elif dep_step["type"] == "per-sample":
                        name = dep_step["title"] + "-" + sample
                        for sample in dataset["sample_ids"].split("\n"):
                            name = dep_step["title"] + "-" + sample
                            u = name2vertex[name]
                            g.add_edge(u, v)
                    
            elif step["type"] == "per-sample":
                for sample in dataset["sample_ids"].split("\n"):
                    name = step["title"] + "-" + sample
                    v = name2vertex[name]
                    for dep in step["hpc_directives"]["dependencies"]:
                        dep_step = stepname2step[dep]
                        if dep_step["skip"]: continue
                        
                        # 1 -> 1
                        if dep_step["type"] == "per-step":
                            name = dep_step["title"]
                            u = name2vertex[name]
                            g.add_edge(u, v)
                        
                        # molti -> 1     
                        elif dep_step["type"] == "per-sample":
                            name = dep_step["title"] + "-" + sample
                            u = name2vertex[name]
                            g.add_edge(u, v)
                            
        print("#" * 100)
        
        # Simplify by removing skip nodes
        vertices_to_remove = set()
        for step in pipeline["steps"]:
            if step["skip"]:
                if step["type"] == "per-step":
                    name = step["title"]
                    v = name2vertex[name]

                    edges_to_remove = []
                    for e_in in g.in_edges(v):
                        fr = e_in[0]
                        edges_to_remove.append(e_in)
                        
                        for e_out in g.out_edges(v):
                            to = e_out[1]
                            edges_to_remove.append(e_out)
                            g.add_edge(fr, to)
                    
                    print("Removing", name)
                    vertices_to_remove.add(v)
                    for e in edges_to_remove:
                        g.remove_edge(e[0], e[1])
                    
                elif step["type"] == "per-sample":
                    for sample in dataset["sample_ids"].split("\n"):
                        name = step["title"] + "-" + sample
                        #print("Trying to remove this step for sample=", sample, name)
                        
                        v = name2vertex[name]
                        
                        edges_to_remove = []
                        for e_in in g.in_edges(v):
                            fr = e_in[0]
                            edges_to_remove.append(e_in)
                            
                            for e_out in g.out_edges(v):
                                to = e_out[1]
                                edges_to_remove.append(e_out)
                                g.add_edge(fr, to)
                        
                        for e in edges_to_remove:
                            g.remove_edge(e[0], e[1])
                        
                        print("Removing", name, v)
                        vertices_to_remove.add(v)

        print("=== V (before) ===")
        for v in g.nodes():
            print(vertex2name[v])
            
        print("=== VERTICES TO REMOVE ===")
        for v in vertices_to_remove:
            print(vertex2name[v])
        for v in vertices_to_remove:
            g.remove_node(v)
        
        print("=== V ===")
        for v in g.nodes():
            print(vertex2name[v])
        
        vertex2step = {}
        roots = []
        for v in g.nodes():
            name = vertex2name[v]
            step = vertexname2step[name]
            vertex2step[v] = step
            if g.in_degree(v) == 0:
                roots.append(v)
        
        fake_root = "ROOT"
        g.add_node(fake_root)
        vertex2name[fake_root] = fake_root
        for root in roots:
            g.add_edge(fake_root, root)
            
        #digraph {
        #     a -> b;
        #     b -> c;
        #     c -> d;
        #     d -> a;
        # }
        dot_file = open(subproject_dir + "/graph.dot", "w")
        dot_file.write("digraph {\n")
        print("Subproject", dataset["id"])
        vertices = []
        for v in g.nodes():
            s = vertex2name[v]
            vertices.append(s)
        print("V=", vertices)
        for vertex in vertices:
            dot_file.write("\"{}\"\n".format(vertex))
        
        edges = []
        for e in g.edges():
            u = vertex2name[e[0]]
            v = vertex2name[e[1]]
            edges.append(u+"->"+v)
            dot_file.write("\"{}\" -> \"{}\";\n".format(u, v))
        print("E=\n", "\n".join(edges))
        dot_file.write("\n}")
        dot_file.close()
        
        command = "dot -Tps {}/graph.dot -o {}/graph.png".format(subproject_dir, subproject_dir)
        ret_code = subprocess.run(command, shell=True)
        print("DOT CONVERSION:\nCommand: {}\nReturn code: {}".format(command, ret_code))
#         print("STEP2INT",name2vertex)
        
        # Save the graph as an image
#         nx.draw_networkx(g)
#         ax = plt.gca()
#         ax.set_axis_off()
#         plt.show()
#         layout = sfdp_layout(g)
#         graph_draw(GraphView(g, directed=True),
#                    pos=layout,
#                    vertex_text=vertex2name,
#                    vertex_font_size=80,
#                    output_size=(10000, 10000),
#                    output=subproject_dir + "/" + subproject_id + ".svg")
        
#         interactive_window(g, pos=sfdp_layout(g), vertex_text=vertex2name, vertex_font_size=20, geometry=(1000, 1000))
        
        # Subproject .sh
        filepath = subproject_dir + "/" + subproject_id +".sh"
        file = open(filepath, "w")
        file.write("#!/bin/bash\n\n")
        file.write("# Project ID: {}\n".format(project["id"]))
        file.write("# Title: {}\n".format(project["title"]))
        file.write("# Subtitle: {}\n".format(project["subtitle"]))
        file.write("# Description: {}\n".format(project["description"]))
        file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
        file.write("# Subproject ID: {}\n\n".format(subproject_id))
        
        file.write("declare -A JOB_IDS\n\n")
        
        # Graph BFS-search
        #bfs_search(g, source=fake_root, visitor=MyBFSVisitor(vertex2step, file, dataset, vertex2name))
        bfs_edges = nx.bfs_edges(g, fake_root)
        for e in bfs_edges:
            u = e[1]

            step = vertex2step[u]
            print("VISITING VERTEX={} STEP={} TYPE={}".format(vertex2name[u], step["title"], step["type"]))
            
            if step["type"] == "per-step":
                single_step_allsamples_writer(step, file, vertex2name, dataset, pipeline, g, u)
            elif step["type"] == "per-sample":
                single_step_singlesample_writer(step, file, vertex2name, dataset, pipeline, g, u)
        
        file.close()
        st = os.stat(filepath)
        os.chmod(filepath, st.st_mode | stat.S_IEXEC)
        
    # Master script
    filepath = script_dir + "/" + project["id"] +".sh"
    file = open(filepath, "w")
    file.write("#!/bin/bash\n\n")
    file.write("# Project ID: {}\n".format(project["id"]))
    file.write("# Title: {}\n".format(project["title"]))
    file.write("# Subtitle: {}\n".format(project["subtitle"]))
    file.write("# Description: {}\n".format(project["description"]))
    file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
    for subproject in project["projects"]:
        subproject_id = subproject["dataset"]["id"]
        file.write("echo '{}\n{}  Analysing subproject {}  {}\n{}\n'\n".format('#'*50, '#'*3, subproject_id, '#'*3, '#'*50))
        file.write("cd {}\n".format(subproject_id))
        file.write("./{}.sh\n".format(subproject_id))
        file.write("cd ..\n")
    file.close()
    st = os.stat(filepath)
    os.chmod(filepath, st.st_mode | stat.S_IEXEC)
    
    #ret_code = subprocess.run("rm {}.zip".format(script_dir), shell=True)
    archive_name = script_dir
    archive_path = script_dir + "/" + archive_name + '.zip'
    if os.path.exists(archive_path): os.remove(archive_path)
    shutil.make_archive(archive_name, 'zip', script_dir)
    
    return HttpResponse("Scripts correctly created for project: '{}'".format(project["id"]))

def replace_variables(x, variables):
    for variable in variables:
        x = x.replace("${"+variable["key"]+"}", variable["value"])
#         x = x.replace("${GENOME}", genome)
#         x = x.replace("${STEP_NAME}", step["title"])
        
    return x

def create_step_all_samples(subproject_id, subproject_dir, step, dataset, pipeline):
    directives = step["hpc_directives"]
    #sample_variable = dataset["sample_variable"]
    variables = pipeline["variables"]
    sample_variable = next(filter(lambda x: x['key'] == "sample_variable", variables))["value"]
    
    sh_name = step["title"]+".sh"
    filepath = subproject_dir + "/" + sh_name
    
    file = open(filepath, "w")
    
    file.write("#!/bin/bash\n\n")
    file.write("# Description: {}\n".format(step["description"]))
    file.write("# Short description: {}\n\n".format(step["description_short"]))
    file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
    
    job_name = directives["job_name"]
    job_name = replace_variables(job_name, variables)
    job_name = job_name.replace("${PROJECT}", subproject_id)
#     job_name = job_name.replace("${GENOME}", genome)
    job_name = job_name.replace("${STEP_NAME}", step["title"].replace(" ", "_"))
#     job_name = job_name.replace("${{{}}}".format(sample_variable), sample)
    
    file.write("#SBATCH --job-name={}\n".format(job_name))
    file.write("#SBATCH -N {}\n".format(directives["nodes"]))
    file.write("#SBATCH -n {}\n".format(directives["cpu"]))
    #file.write("#SBATCH -n {}\n".format(directives["mpi_procs"]))
    file.write("#SBATCH -p {}\n".format(directives["queue"]))
    file.write("#SBATCH --mem={}{}\n".format(directives["memory"]["quantity"], directives["memory"]["size"]))
    file.write("#SBATCH --time {}\n".format(directives["walltime"]))
    file.write("#SBATCH --account {}\n".format(directives["account"]))
    
    if "error" not in directives or directives["error"] == "":
#         directives["error"] = step["title"] + ".err"
        pass
    else:
        directives["error"] = replace_variables(directives["error"], variables)
        directives["error"] = directives["error"].replace("${STEP_NAME}", step["title"])
        file.write("#SBATCH --error {}\n".format(directives["error"].replace(" ", "-")))
    
    if "output" not in directives or directives["output"] == "":
#         directives["output"] = step["title"] + ".out"
        pass
    else:
        directives["output"] = replace_variables(directives["output"], variables)
        directives["output"] = directives["output"].replace("${STEP_NAME}", step["title"])
        file.write("#SBATCH --output {}\n".format(directives["output"].replace(" ", "-")))
    
    file.write("cd $SLURM_SUBMIT_DIR\n\n")
    
    file.write("\n\n# Module(s) loading\n\n")
    
    for module in step["modules"]:
        file.write("module load autoload {}\n".format(module))
    
    file.write("\n\n# Command line(s)\n\n")
    
    if step["iterate"]:
        file.write("""
for {} in `cat "dataset.txt"`
do\n
""".format(sample_variable))
                
    conditions = step["conditions"]
    if conditions:
        for condition in conditions:
            file.write("""
    {}
    step_condition=$?
    echo "{}"
    echo {} $step_condition
    if [ "$step_condition" -eq 0 ]
    then
        continue
    fi
    
""".format(condition["command"], condition["command"], step["title"]))
    
    if step["iterate"]:
        file.write("    if [ ! -d ${} ] ; then mkdir ${}; fi\n".format(sample_variable, sample_variable))
    
    file.write("    set +o xtrace;\n    {}".format(step["commandline"]))
    
    if "write_stdout_log" in step and step["write_stdout_log"]:
        file.write(" >\"${}/{}.out\"".format(sample_variable, step["title"]))

    if "write_stderr_log" in step and step["write_stderr_log"]:
        file.write(" 2>\"${}/{}.err\"".format(sample_variable, step["title"]))
    
    if "sequential" not in step or step["sequential"] == False:
        file.write(" &")
        
    file.write("\n")
    
    if step["iterate"]:
        file.write("""
done
wait
""")
                
    file.close()
    
    st = os.stat(filepath)
    os.chmod(filepath, st.st_mode | stat.S_IEXEC)

def create_allsteps_single_sample(subproject_id, subproject_dir, step, dataset, pipeline):
    directives = step["hpc_directives"]
    variables = pipeline["variables"]
    sample_variable = next(filter(lambda x: x['key'] == "sample_variable", variables))["value"]
    
    for sample in dataset["sample_ids"].split("\n"):
        sh_name = step["title"] + "-" + sample + ".sh"
        
        filepath = subproject_dir + "/" + sh_name
        
        file = open(filepath, "w")
        
        file.write("#!/bin/bash\n\n")
        file.write("# Description: {}\n".format(step["description"]))
        file.write("# Short description: {}\n\n".format(step["description_short"]))
        file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
        
        job_name = directives["job_name"]
        job_name = replace_variables(job_name, variables)
        job_name = job_name.replace("${PROJECT}", subproject_id)
#         job_name = job_name.replace("${GENOME}", genome)
        job_name = job_name.replace("${STEP_NAME}", step["title"].replace(" ", "_"))
        job_name = job_name.replace("${{{}}}".format(sample_variable), sample)
        
        file.write("#SBATCH --job-name={}\n".format(job_name))
        file.write("#SBATCH -N {}\n".format(directives["nodes"]))
        file.write("#SBATCH -n {}\n".format(directives["cpu"]))
        #file.write("#SBATCH -n {}\n".format(directives["mpi_procs"]))
        file.write("#SBATCH -p {}\n".format(directives["queue"]))
        file.write("#SBATCH --mem={}{}\n".format(directives["memory"]["quantity"], directives["memory"]["size"]))
        file.write("#SBATCH --time {}\n".format(directives["walltime"]))
        file.write("#SBATCH --account {}\n".format(directives["account"]))
        
        if "error" not in directives or directives["error"] == "":
#             directives["error"] = step["title"]
            pass
        else:
            directives["error"] = directives["error"].replace("${STEP_NAME}", step["title"])
            file.write("#SBATCH --error {}\n".format(sample + "-" + directives["error"].replace(" ", "-")))
            
        if "output" not in directives or directives["output"] == "":
#             directives["output"] = step["title"]
            pass
        else:
            directives["output"] = directives["output"].replace("${STEP_NAME}", step["title"])
            file.write("#SBATCH --output {}\n".format(sample + "-" + directives["output"].replace(" ", "-")))
        
        file.write("cd $SLURM_SUBMIT_DIR\n\n")
        
        file.write("\n\n# Module(s) loading\n\n")
        
        for module in step["modules"]:
            file.write("module load autoload {}\n".format(module))
        
        file.write("\n\n# Command line(s)\n\n")
        
        file.write("{}=\"{}\"\n\n".format(sample_variable, sample))
        
        conditions = step["conditions"]
        if conditions:
            for condition in conditions:
                
                command = condition["command"]
                #command = command.replace("${SAMPLE}", sample)
                
                file.write("""
{}
step_condition=$?
echo "{}"
echo {} {} $step_condition
if [ "$step_condition" -eq 0 ]
then
    exit
fi
""".format(command, sample, command, step["title"]))
        
        file.write("if [ ! -d ${} ] ; then mkdir ${}; fi\n".format(sample_variable, sample_variable))
        
        file.write("set +o xtrace; {}".format(step["commandline"]))
    
        if "write_stdout_log" in step and step["write_stdout_log"]:
            file.write(" >\"${}/{}.out\"".format(sample_variable, step["title"]))

        if "write_stderr_log" in step and step["write_stderr_log"]:
            file.write(" 2>\"${}/{}.err\"".format(sample_variable, step["title"]))
                            
        file.close()
        
        st = os.stat(filepath)
        os.chmod(filepath, st.st_mode | stat.S_IEXEC)
    
def download_scripts(request):
    project = json.loads(request.body.decode('utf-8'))
    return HttpResponse(json.dumps(
        {
            "url": "download/" + project["id"] + ".zip",
            "filename": project["id"] + ".zip"
         }))

def download_csv(request):
    project = json.loads(request.body.decode('utf-8'))
    
    script_dir = os.path.dirname(__file__) + "/scripts/" + project["id"]
    if not os.path.exists(script_dir):
        os.makedirs(script_dir)
    
    bioproject2srr = {}
    for group in project["projects"]:
        bioproject_id = group["dataset"]["bioproject_id"]
        for srr in group["dataset"]["sample_ids"].split("\n"):
            if bioproject_id not in bioproject2srr: bioproject2srr[bioproject_id] = []
            bioproject2srr[bioproject_id].append(group)
    
    for bioproject_id in bioproject2srr:
        groups = bioproject2srr[bioproject_id]
        
        attribute_keys = set()
        for group in groups:
            for attribute_key in group["dataset"]["attributes"].keys():
                attribute_keys.add(attribute_key)
        
        attribute_keys_to_remove = []
        for attribute_key in attribute_keys:
            attribute_values = Counter()
            for group in groups:
                for run in group["dataset"]["sample_ids"].split("\n"):
                    if attribute_key in group["dataset"]["attributes"]:
                        value = group["dataset"]["attributes"][attribute_key]
                        attribute_values[value] += 1
                        
            if len(attribute_values.keys()) == 1:
                print("Discarding column {} for ProjectID={} Counter={}".format(attribute_key, bioproject_id, attribute_values))
                attribute_keys_to_remove.append(attribute_key)
        
        for attribute_key in attribute_keys_to_remove:
            attribute_keys.remove(attribute_key)
        
        csv_writer = open(script_dir + "/" + bioproject_id + ".csv", "w")
        csv_writer.write("ids," + ",".join([a.replace(" ", "_") for a in attribute_keys]) + "\n")
        for group in groups:
            for run in group["dataset"]["sample_ids"].split("\n"):
                fields = []
                fields.append(run)
                for attribute_key in attribute_keys:
                    value = ""
                    if attribute_key in group["dataset"]["attributes"]:
                        value = group["dataset"]["attributes"][attribute_key]
                    fields.append(value)
                csv_writer.write(",".join([a.replace(" ", "_") for a in fields]) + "\n")
        csv_writer.close()
        
    archive_name = project["id"] + "_csv.zip"
    archive_path = script_dir + "/" + archive_name
    print("ARCHIVE NAME", archive_name, script_dir, archive_path)
    
    if os.path.exists(archive_path): os.remove(archive_path)
    for f in glob.glob(script_dir + "/*"):
        print(f)

    with zipfile.ZipFile(archive_path, 'w') as zip:
        for file_name in glob.glob(script_dir + "/*.csv"):
            print(file_name)
            zip.write(file_name, os.path.basename(file_name))
    zip.close()
        
    return HttpResponse(json.dumps(
        {
            "url": "download/" + project["id"] + "/" + project["id"] + "_csv.zip",
            "filename": project["id"] + "_csv.zip"
         }))
    
