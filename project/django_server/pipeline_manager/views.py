from django.shortcuts import render
from django.http import HttpResponse
import json
import os
import time
import re
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

def add_papers(request, project_id, bioproject_id):
    print(request)
    
    response = []
    print(request.FILES)
    samples_set = set()
    for file in request.FILES.values():
        paper_dir = os.path.dirname(__file__) + "/data/"+project_id+"/" + bioproject_id + "/papers/"
        if not os.path.exists(paper_dir):
            os.makedirs(paper_dir)
        filepath = paper_dir + file.name
        default_storage.save(filepath, ContentFile(file.read()))
         
        response.append({
            "url": filepath.replace(os.path.dirname(__file__) + "/", ""),
            "source": "manual"
        })
        
    return HttpResponse(json.dumps(response))

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
        print("EXPERIMENT_ID=", experiment_id, "BIOPROJECT_ID=", bioproject_id, "ORGANISM=", organism)
        
        attributes = {}
        for attribute in project_elem.iter("SAMPLE_ATTRIBUTE"):
            tag = attribute.findtext("TAG")
            value = attribute.findtext("VALUE")
            print("SAMPLE ATTRIBUTE", tag, "VALUE", value)
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
            "id": experiment_id,
            "type": "experiment",
            "dataset": {
                "size": total_size,
                "bioproject_id": bioproject_id,
                "platform": platform,
                "pairedend": layout == "PAIRED",
                "sample_ids": [{
                        "type": "run",
                        "id": x
                    } for x in selected_run_ids],
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
        
        # Find the bioproject data of this experiment
        result = [x for x in response if x["id"] == bioproject_id]        
        # If there's none, this is the first time we create the project for this experiment
        if not result:
            empy_project = {
                "id": bioproject_id,
                "type": "bioproject",
                "experiments": []
            }
            result = [empy_project]
            response.append(empy_project)

        project = result[0]
        
        project["experiments"].append(bioproject_data)
        
    return response

def create_projects(request):
    
    print(request)
    print(request.body.decode("utf-8"))
    
    data = json.loads(request.body.decode("utf-8"))
    print(data)
                        
    init_ncbi_tools()
    
    samples = data["list"].split("\n")
    
    db = "sra"
#     prefixes = Counter()
#     if samples:
#         for sample in samples:
#             prefix = sample.replace("[0-9]*$")
#             prefixes[prefix] += 1
#     print(prefixes)
    
#     bioproject_search = True
    samples_set = set()
    if samples and (samples[0].startswith("SRR") or samples[0].startswith("DRR") or samples[0].startswith("ERR")):
#         bioproject_search = False
        samples_set = set(samples)
    
    print("DB=", db)
    
    try:
        handle = Entrez.esearch(retmax=1000, db=db, term=' OR '.join(samples))
        record = Entrez.read(handle)
        handle.close()
    except RuntimeError as e:
        return HttpResponse(json.dumps({"message": str(e)}))
    
    print("RESULT", record)
    ids = record["IdList"]
    
    print("{}/{} IDS returned".format(len(ids), len(samples)))
    
    handle2 = Entrez.efetch(db=db, id=','.join(ids))
    record = handle2.read()
    handle2.close()
    
    sra_filepath = os.path.dirname(__file__) + "/temp/sra.xml"
    default_storage.save(sra_filepath, ContentFile(record))
    
    tree = etree.fromstring(record)
    
    response = convert_ncbi_response(samples_set, tree)

    found = set()
    for bioproject in response:
        found.add(bioproject["id"])
    print("FOUND", found)
    
    for x in samples:
        prefix = re.sub('\d', '', x)
        
        if prefix == "PRJNA":
            print("NOT_FOUND", x)

            response.append({
                    "id": x,
                    "type": "bioproject",
                    "experiments": []
                })

    return HttpResponse(json.dumps(response))

# def single_step_allsamples_writer(step, file, vertex2name, dataset, pipeline, g, u):
#     
#     #sample_variable = dataset["sample_variable"]
#     sample_variable = next(filter(lambda x: x['key'] == "sample_variable", pipeline["variables"]))["value"]
#     
#     sh_file = step["title"]+".sh"
#         
#     file.write("##########################\n######  {}  ########\n##########################\n".format(step["title"]))
#     
#     file.write("execute=1\n")
#     
#     # Add the run-time conditions to check before launching the command
#     conditions = step["conditions"]
#     if conditions:
#         for condition in conditions:
#             
#             file.write(
# """
# # Checking skip conditions
# execute=0
# for {} in `cat "dataset.txt"`
# do
#     {}
#     step_condition=$?
#     echo "{}"
#     echo {} ${} $step_condition
#     if [ "$step_condition" -eq 1 ]
#     then
#         execute=1
#         break
#     fi
# done
# 
# """.format(sample_variable, condition["command"], condition["command"], step["title"], sample_variable))
# 
#     # TODO - clearer: eventually write explicit variables called like: trimmomatic_job_long_name and concatenate
#     # these to form the depend=afterany string
#     file.write("DEPS=()\n")
#     for dep in g.predecessors(u):
#         dep_name = vertex2name[dep]
#         if dep_name == "ROOT": continue
#         
#         dep_script = """
# DEP_JOB_NAME="{}"
# echo "DEP JOB NAME="$DEP_JOB_NAME
# DEP_JOB_ID=${{JOB_IDS["$DEP_JOB_NAME"]}}
# echo "DEPJOBID="$DEP_JOB_ID
# 
# if [ ! -z $DEP_JOB_ID ]
# then
#     DEPS+=($DEP_JOB_ID)
# fi """.format(dep_name)
#                 
#         file.write(dep_script)
#             
#     script = """
# sh_file="{}"
# echo $sh_file "execute="$execute
# if [ $execute -eq 1 ]
# then
#     echo "DEPENDENCIES($sh_file)=" ${{DEPS[@]}}
#     set -o xtrace
#     if [[ ! -z "$DEPS" ]]
#     then
#         job_long_name=$(sbatch --depend=afterany$(printf ":%s" "${{DEPS[@]}}") ./"$sh_file")
#     else
#         job_long_name=$(sbatch ./"$sh_file")
#     fi
#     
#     job_id=$(echo $job_long_name | cut -d' ' -f4)
#     echo "$sh_file => $job_id"
#     JOB_IDS["{}"]=$job_id
#     
#     set +o xtrace
# else
#     echo "Skipping $sh_file file"
# fi
# """.format(sh_file, step["title"])
#         
#     file.write(script)
#     
# def single_step_singlesample_writer(step, file, vertex2name, dataset, pipeline, g, u):
#     
#     #sample_variable = dataset["sample_variable"]
#     sample_variable = next(filter(lambda x: x['key'] == "sample_variable", pipeline["variables"]))["value"]
#     
#     for sample in dataset["sample_ids"].split("\n"):
#         v_name = vertex2name[u]
#         name = step["title"] + "-" + sample
#         if v_name != name: continue
#         
#         sh_file = name + ".sh"
#         
#         file.write("\n\n\n##########################\n######  {}  ########\n##########################\n".format(name))
#     
#         file.write("execute=1\n")
#     
#         # Add the run-time conditions to check before launching the command
#         conditions = step["conditions"]
#         if conditions:
#             for condition in conditions:
#                 command = condition["command"]
#                 command = command.replace("${}".format(sample_variable), sample)
#                 command = command.replace("${{{}}}".format(sample_variable), sample)
#                     
#                 file.write(
# """
# # Checking skip conditions
# execute=0
# {}
# step_condition=$?
# echo "{}"
# echo {} {} $step_condition
# if [ "$step_condition" -eq 1 ]
# then
#     execute=1
# fi
# 
# """.format(command, command, name, sample))
# 
#         # TODO - clearer: eventually write explicit variables called like: trimmomatic_job_long_name and concatenate
#         # these to form the depend=afterany string
#         file.write("DEPS=()\n")
#         for dep in g.predecessors(u):
#             dep_name = vertex2name[dep]
#             if dep_name == "ROOT": continue
#             
#             dep_script = """
# DEP_JOB_NAME="{}"
# echo "DEP JOB NAME="$DEP_JOB_NAME
# DEP_JOB_ID=${{JOB_IDS["$DEP_JOB_NAME"]}}
# echo "DEPJOBID="$DEP_JOB_ID
# 
# if [ ! -z $DEP_JOB_ID ]
# then
#     DEPS+=($DEP_JOB_ID)
# fi
# 
# """.format(dep_name)
#                 
#             file.write(dep_script)
#             
#         script = """
# sh_file="{}"
# echo $sh_file "execute="$execute
# if [ $execute -eq 1 ]
# then
#     echo "DEPENDENCIES($sh_file)=" ${{DEPS[@]}}
#     set -o xtrace
#     if [[ ! -z "$DEPS" ]]
#     then
#         job_long_name=$(sbatch --depend=afterany$(printf ":%s" "${{DEPS[@]}}") ./"$sh_file")
#     else
#         job_long_name=$(sbatch ./"$sh_file")
#     fi
#     
#     job_id=$(echo $job_long_name | cut -d' ' -f4)
#     echo "$sh_file => $job_id"
#     JOB_IDS["{}"]=$job_id
#     
#     set +o xtrace
# else
#     echo "Skipping $sh_file file"
# fi
# """.format(sh_file, name)
# 
#         file.write(script)

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

def accounts(request, cluster_id, prefix = None):
    accounts = []
    ids = set()

    for line in open(os.path.dirname(__file__) + "/utils/all_accounts_" + cluster_id + ".txt"):
        line = line.rstrip()
        if prefix is None or prefix in line:
            if line not in ids:
                ids.add(line)
                accounts.append({"label": line})
        
    return HttpResponse(json.dumps(accounts))

def qos(request, cluster_id):
    qos = []
    
    map = {
        "galileo": "gll",
        "marconi_broadwell": "bdw",
        "marconi_knl": "knl",
        "marconi_skl": "skl"
    }
    
    for line in open(os.path.dirname(__file__) + "/utils/all_qos.txt"):
        fields = line.rstrip().split("\t")
        name = fields[0]
        limits = fields[1] if len(fields) > 1 else ""
        if name.startswith(map[cluster_id]):
            qos.append({"id": name, "name": name, "info": limits})
        
    return HttpResponse(json.dumps(qos))

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

def pipelines(request):
    return HttpResponse(json.dumps(json.load(open(os.path.dirname(__file__) + "/utils/pipelines.json"))))

def steps(request):
    return HttpResponse(json.dumps(json.load(open(os.path.dirname(__file__) + "/utils/steps.json"))))


def upload_pipeline(request):
    pipeline = json.loads(request.body.decode('utf-8'))

    current_pipelines = json.load(open(os.path.dirname(__file__) + "/utils/pipelines.json"))
    print(len(current_pipelines))
    for p in current_pipelines["pipelines"]:
        if p["id"] == pipeline["id"]:
            return HttpResponse(json.dumps({"type": "error", "message": "Pipeline " + pipeline["id"] + " already existing."}))
    
    # Append the new pipeline
    current_pipelines["pipelines"].append(pipeline)
    
    # Save the new file
    filepath = os.path.dirname(__file__) + "/utils/pipelines.json"
    open(filepath, "w").write(json.dumps(current_pipelines, indent=4, sort_keys=True))
    
    return HttpResponse(json.dumps({"type": "info", "message": "Pipeline " + pipeline["id"] + " correctly added to the repository."}))

def upload_step(request, overwrite=False):
    
    print("OVERWRITE", overwrite)
    
    step = json.loads(request.body.decode('utf-8'))

    filepath = os.path.dirname(__file__) + "/utils/steps.json"
    current_steps = {"steps": []}
    if os.path.exists(filepath):
        current_steps = json.load(open(filepath))
    print(len(current_steps))
    
    to_replace = None
    for s in current_steps["steps"]:
        if s["title"] == step["title"]:
            to_replace = s
            break
        
    if to_replace is not None:
        if not overwrite:
            return HttpResponse(json.dumps({"type": "error", "message": "Step " + step["title"] + " already existing."}))
        else:
            current_steps["steps"].remove(to_replace)
    
    # Append the new pipeline
    current_steps["steps"].append(step)
    
    # Save the new file
    open(filepath, "w").write(json.dumps(current_steps, indent=4, sort_keys=True))
    
    return HttpResponse(json.dumps({"type": "info", "message": "Step " + step["title"] + " correctly added to the repository."}))
    
def templates(request):
    return HttpResponse(json.dumps(json.load(open(os.path.dirname(__file__) + "/utils/templates.json"))))

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
    
#     for group in data["projects"]:
#         print(group["dataset"]["id"], group["dataset"]["pipeline"])
    
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
    """
        g2 usually are the pipeline's tags and 
        g1 are the bioentity's tags
    """

    type2tag1 = {}
    type2tag2 = {}
    for x in g1:
        if x["type"] not in type2tag1:
            type2tag1[x["type"]] = set()
        type2tag1[x["type"]].add(x["name"])
        
    for x in g2:
        if x["type"] not in type2tag2:
            type2tag2[x["type"]] = set()
        type2tag2[x["type"]].add(x["name"])
    
    compatible = True
    
    for type in type2tag2:
        if type not in type2tag1 or len(type2tag2[type].intersection(type2tag1[type])) == 0:
            compatible = False
            break
    
    return compatible

def get_tags(dataset, bio_entity, level):
    
    tags = list()
    tags_key = set()
    
    if level == "top":
        for project in dataset["projects"]:
            for experiment in project["experiments"]:
                for tag in experiment["dataset"]["tags"]:
                    tag_key = tag["name"] + "#" + tag["type"]
                    if tag_key not in tags_key:
                        tags_key.add(tag_key)
                        tags.append(tag)
    
    if level == "project":
        for project in dataset["projects"]:
            if project["id"] != bio_entity["id"]: continue
            
            for experiment in project["experiments"]:
                for tag in experiment["dataset"]["tags"]:
                    tag_key = tag["name"] + "#" + tag["type"]
                    if tag_key not in tags_key:
                        tags_key.add(tag_key)
                        tags.append(tag)
                    
    if level == "experiment":
        for project in dataset["projects"]:
            for experiment in project["experiments"]:
                if experiment["id"] != bio_entity["id"]: continue
                
                for tag in experiment["dataset"]["tags"]:
                    tag_key = tag["name"] + "#" + tag["type"]
                    if tag_key not in tags_key:
                        tags_key.add(tag_key)
                        tags.append(tag)
                    
    if level == "sample":
        for project in dataset["projects"]:
            for experiment in project["experiments"]:
                samples = [x["id"] for x in experiment["dataset"]["sample_ids"]]
                if bio_entity["id"] not in samples: continue
                
                for tag in experiment["dataset"]["tags"]:
                    tag_key = tag["name"] + "#" + tag["type"]
                    if tag_key not in tags_key:
                        tags_key.add(tag_key)
                        tags.append(tag)
                    
    if level == "specific":
        # TODO
        pass
    
    return tags

def produce_script(v, vertex2name, project, pipeline, step, bioentity):
    if step["skip"]: return None
    
    name = vertex2name[v]
    bioentity_id = bioentity["id"]
    
    script_level = step["script_level"] # where to put the script
    command_level = step["command_level"] # what the command is defined over
    command_parallelism_level = step["command_parallelism_level"] # sequential or parallel
    command_group_level = step["command_group_level"] if "command_group_level" in step else "all" # all - chunks
    #command_chunk_size = step["command_chunk_size"] #
    
    directives = step["hpc_directives"]
    parallel = step["command_parallelism_level"] == "parallel"
    
    levels = ["top", "project", "experiment", "sample"]
    script_level_index = levels.index(script_level)
    command_level_index = levels.index(command_level)
    
    print("PRODUCE_SCRIPT", pipeline["id"], step["title"], bioentity_id, script_level, script_level_index)
        
    sh_file = name + ".sh"
    sh_dir = None
    
    bioproject = None
    experiment = None
    
    if script_level_index == 0: # top
        sh_dir = "./"
        
    if script_level_index == 1: # project
        bioproject = bioentity
        sh_dir = bioentity_id + "/"
        
    if script_level_index == 2: # experiment
        bioproject_id = None
        for biopr in project["projects"]:
            if bioproject_id is not None: break
            for exp in biopr["experiments"]:
                if exp["id"] == bioentity_id:
                    bioproject_id = biopr["id"]
                    bioproject = biopr
                    experiment_id = exp["id"]
                    experiment = bioentity
                    break
        sh_dir = bioproject_id + "/" + bioentity_id + "/"
        
    if script_level_index == 3: # sample
        bioproject_id = None
        experiment_id = None
        for biopr in project["projects"]:
            if bioproject_id is not None: break
            for exp in biopr["experiments"]:
                if experiment_id is not None: break
                for sample in exp["dataset"]["sample_ids"]:
                    if sample == bioentity:
                        bioproject_id = biopr["id"]
                        bioproject = biopr
                        experiment_id = exp["id"]
                        experiment = exp
                        print("FOUND", bioentity, bioproject_id, experiment_id, )
                        break
        print(bioproject_id, experiment_id, bioentity)
        sh_dir = bioproject_id + "/" + experiment_id + "/" + bioentity_id + "/"
    
    script_dir = os.path.dirname(__file__) + "/scripts/" + project["id"] + "/data/" + sh_dir
    if not os.path.exists(script_dir): os.makedirs(script_dir)
    filepath = script_dir + sh_file
        
    file = open(filepath, "w")

    file.write("#!/bin/bash\n\n")
    file.write("# Description: {}\n".format(step["description"]))
    file.write("# Short description: {}\n\n".format(step["description_short"]))
    file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
    
    job_name = directives["job_name"]
    job_name = replace_variables(job_name, project, bioproject, experiment, pipeline, step, bioentity)
#     job_name = job_name.replace("${PROJECT}", subproject_id)
#     job_name = job_name.replace("${STEP_NAME}", step["title"].replace(" ", "_"))
     
    file.write("#SBATCH --job-name={}\n".format(job_name))
    if "mpi_procs" in directives and directives["mpi_procs"] is not None and directives["mpi_procs"] > 0:
        file.write("#SBATCH --ntasks={}\n".format(int(directives["mpi_procs"]) * int(directives["nodes"])))
        file.write("#SBATCH --ntasks-per-node={}\n".format(directives["mpi_procs"]))
    else:
        file.write("#SBATCH -N {}\n".format(directives["nodes"]))
        file.write("#SBATCH -n {}\n".format(directives["cpu"]))
    #file.write("#SBATCH -n {}\n".format(directives["mpi_procs"]))
    file.write("#SBATCH -p {}\n".format(directives["queue"]))
    file.write("#SBATCH --mem={}{}\n".format(directives["memory"]["quantity"], directives["memory"]["size"]))
    file.write("#SBATCH --time {}\n".format(directives["walltime"]))
    file.write("#SBATCH --account {}\n".format(directives["account"]))
     
    if "error" not in directives or directives["error"] == "":
        pass
    else:
        directives["error"] = replace_variables(directives["error"], project, bioproject, experiment, pipeline, step, bioentity)
#             directives["error"] = directives["error"].replace("${STEP_NAME}", step["title"])
        file.write("#SBATCH --error {}\n".format(directives["error"].replace(" ", "-")))
     
    if "output" not in directives or directives["output"] == "":
        pass
    else:
        directives["output"] = replace_variables(directives["output"], project, bioproject, experiment, pipeline, step, bioentity)
#         directives["output"] = directives["output"].replace("${STEP_NAME}", step["title"])
        file.write("#SBATCH --output {}\n".format(directives["output"].replace(" ", "-")))
     
    file.write("cd $SLURM_SUBMIT_DIR\n\n")
    
    file.write("\n\n# Module(s) loading\n\n")
     
    for module in step["modules"]:
        file.write("module load autoload {}\n".format(module))
     
    loops = max(0, command_level_index - script_level_index)
    
    
     
     
    if script_level_index == 0: # top
        
        if command_level_index == 1:
            file.write("""
for PROJECT in `cat projects`; do
    cd $PROJECT
""")

        if command_level_index == 2:
            file.write("""
for PROJECT in `cat projects`; do
    cd $PROJECT
    
    for EXPERIMENT in `cat experiments`; do
        cd $EXPERIMENT
""")

        if command_level_index == 3:
            file.write("""
for PROJECT in `cat projects`; do
    cd $PROJECT
    for EXPERIMENT in `cat experiments`; do
        cd $EXPERIMENT
        for SAMPLE in `cat samples`; do
            cd $SAMPLE
""")
    
    
    
    
    if script_level_index == 1: # project
        
        if command_level_index == 1:
            file.write("""
PROJECT={}
""".format(bioentity_id))
        
        if command_level_index == 2:
            file.write("""
PROJECT={}
for EXPERIMENT in `cat experiments`; do
    cd $EXPERIMENT
""".format(bioentity_id))
            
        if command_level_index == 3:
            file.write("""
PROJECT={}
for EXPERIMENT in `cat experiments`; do
    cd $EXPERIMENT
    for SAMPLE in `cat samples`; do
        cd $SAMPLE
""".format(bioentity_id))



    
    if script_level_index == 2: # experiment
        if command_level_index == 2:
            file.write("""
EXPERIMENT={}
""".format(bioentity_id))
        
        if command_level_index == 3:
            file.write("""
    EXPERIMENT={}
    for SAMPLE in `cat samples`; do
        cd $SAMPLE
""".format(bioentity_id))




    if script_level_index == 3: # run
        file.write("""
PROJECT={}\n
EXPERIMENT={}\n
SAMPLE={}\n
""".format(bioproject["id"], experiment["id"], bioentity_id))
            
            
            
            
    file.write("    " * loops)
    file.write("execute=1\n")

    # Add the run-time conditions to check before launching the command
    conditions = step["conditions"]
    if conditions:
        for condition in conditions:
            command = condition["command"]
            command = replace_variables(command, project, bioproject, experiment, pipeline, step, bioentity)
#             command = command.replace("${}".format(sample_variable), sample)
#             command = command.replace("${{{}}}".format(sample_variable), sample)
                
            file.write(
                """
                # Checking skip conditions
                execute=0
                {}
                step_condition=$?
                echo "{}"
                echo {} $step_condition
                if [ "$step_condition" -eq 1 ]
                then
                    execute=1
                fi
                \n""".format(command, command, name))

    file.write("    " * loops)
    file.write("# Command line(s)\n")
    command_line = step["commandline"]
    command_line = replace_variables(command_line, project, bioproject, experiment, pipeline, step, bioentity)
    file.write("    " * loops)
    file.write("set +o xtrace;\n")
    file.write("    " * loops + "if [ $execute -eq 1 ]; then\n")
    file.write("    " * (loops+1))
    file.write("{}".format(command_line))
#     if "write_stdout_log" in step and step["write_stdout_log"]:
#         file.write(" >\"${}/{}.out\"".format(sample_variable, step["title"]))
#     if "write_stderr_log" in step and step["write_stderr_log"]:
#         file.write(" 2>\"${}/{}.err\"".format(sample_variable, step["title"]))
    if parallel: file.write(" &\n")
    else: file.write("\n")
    file.write("    " * loops + "fi\n")
     
    while(loops > 0):
        loops -= 1
        file.write("    " * (loops+1) + "cd ..\n")
        file.write("    " * loops + "done\n")
        
    if parallel:
        file.write("""
wait
        """)

    file.close()
     
    st = os.stat(filepath)
    os.chmod(filepath, st.st_mode | stat.S_IEXEC)
    
    if "executables" in step:
        for executable in step["executables"]:
            p = script_dir + "/" + executable["filename"]
            f = open(p, "w")
            f.write(executable["command"])
            f.close()
            st = os.stat(p)
            os.chmod(p, st.st_mode | stat.S_IEXEC)
    
    return filepath

def contains(u_bioentity, v_bioentity):
    if u_bioentity["id"] == v_bioentity["id"]: return True
    
    if u_bioentity["type"] == "project": # top level
        for bioproject in u_bioentity["projects"]:
            if contains(bioproject, v_bioentity):
                return True
        return False
    
    if u_bioentity["type"] == "bioproject": # project level
        for experiment in u_bioentity["experiments"]:
            if contains(experiment, v_bioentity):
                return True
        return False
    
    if u_bioentity["type"] == "experiment": # experiment level
        for sample in u_bioentity["dataset"]["sample_ids"]:
            if contains(sample, v_bioentity):
                return True
        return False
    
    else: #sample level
        return u_bioentity == v_bioentity

def produce_scripts(request):
    project = json.loads(request.body.decode('utf-8'))

    # Create project base dir
    script_dir = os.path.dirname(__file__) + "/scripts/" + project["id"] + "/"
    if not os.path.exists(script_dir):
        os.makedirs(script_dir)
        
    data_dir = script_dir + "data/"
    if not os.path.exists(data_dir): os.mkdir(data_dir)
    f = open(data_dir + "projects", "w")
    f.write('\n'.join([x["id"] for x in project["projects"]]))
    f.close()
    for bioproject in project["projects"]:
        bioproject_dir = data_dir + bioproject["id"] + "/"
        if not os.path.exists(bioproject_dir): os.mkdir(bioproject_dir)
        f = open(bioproject_dir + "experiments", "w")
        f.write('\n'.join([x["id"] for x in bioproject["experiments"]]))
        f.close()
            
        for experiment in bioproject["experiments"]:
            experiment_dir = bioproject_dir + experiment["id"] + "/"
            if not os.path.exists(experiment_dir): os.mkdir(experiment_dir)
            f = open(experiment_dir + "samples", "w")
            f.write('\n'.join([x["id"] for x in experiment["dataset"]["sample_ids"]]))
            f.close()
            
            for sample in experiment["dataset"]["sample_ids"]:
                sample_dir = experiment_dir + sample["id"] + "/"
                if not os.path.exists(sample_dir): os.mkdir(sample_dir)
    
#     pipelines = project["pipelines"]
#     for pipeline in project["pipelines"]: pipelines[pipeline["id"]] = pipeline
    
    # Initial graph setup
    g = nx.DiGraph()
    name2vertex = {}
    vertex2name = {}
    vertexname2step = {}
    vertexname2bioentity = {}
#     string2vertex = {}
    
    for pipeline in project["pipelines"]:
        
        pipeline_id = pipeline["id"]
        print("=============== {} ==============".format(pipeline_id))
        
        step2vertices = {}
        stepname2step = {}
        for step in pipeline["steps"]:
            step2vertices[step["title"]] = []
            stepname2step[step["title"]] = step
        
        for step in pipeline["steps"]:
            if step["skip"]: continue
            
            step_id = step["title"]
            
            if "script_level" not in step:
                print("[WARN] {}-{} has not a script_level defined.".format(pipeline_id, step_id))
                continue
            
            script_level = step["script_level"] # where to put the script
            print(pipeline_id, step_id, script_level)
            
            # Take the bioentities associated to this step
            bio_entities = []
            if script_level == "top": bio_entities = [project]
            if script_level == "project":
                for bioproject in project["projects"]:
                    if "disabled" in bioproject and bioproject["disabled"] == True: continue
                    bio_entities.append(bioproject)
                    
            if script_level == "experiment":
                for bioproject in project["projects"]:
                    if "disabled" in bioproject and bioproject["disabled"] == True: continue
                    for experiment in bioproject["experiments"]:
                        if "disabled" in experiment and experiment["disabled"] == True: continue
                        bio_entities.append(experiment)
                        
            if script_level == "sample":
                for bioproject in project["projects"]:
                    if "disabled" in bioproject and bioproject["disabled"] == True: continue
                    for experiment in bioproject["experiments"]:
                        if "disabled" in experiment and experiment["disabled"] == True: continue
                        for sample in experiment["dataset"]["sample_ids"]:
                            if "disabled" in sample and sample["disabled"] == True: continue
                            bio_entities.append(sample)
                            
            if script_level == "specific": # TODO
                pass
            
            print(pipeline_id, step_id, script_level, [x["id"] for x in bio_entities])
            
            # Take only the compatible bioentities
            compatible_bio_entities = []
            for bio_entity in bio_entities:
                bioentity_tags = get_tags(project, bio_entity, script_level)
                is_compatible = tags_compatibles(bioentity_tags, pipeline["tags"])
                if is_compatible:
                    compatible_bio_entities.append(bio_entity)
            
            # The number of scripts will be the number or required compatible bioentities
            for compatible_bio_entity in compatible_bio_entities:
                bioentity_id = compatible_bio_entity["id"]
                
                vertex_name = pipeline_id + "#" + step_id + "#" + bioentity_id 
                v = vertex_name
                step2vertices[step_id].append(v)
                g.add_node(v)
                name2vertex[vertex_name] = v
                vertex2name[v] = vertex_name
                vertexname2step[vertex_name] = step
                vertexname2bioentity[vertex_name] = compatible_bio_entity
        
        for step in pipeline["steps"]:
            if step["skip"]: continue
            
            step_id = step["title"]
            for dep in step["hpc_directives"]["dependencies"]:
                dep_step = stepname2step[dep]
                if dep_step["skip"]: continue

                dep_id = dep_step["title"]
                
                print(pipeline_id, step_id, dep_id)
                
                for u in step2vertices[dep_id]:
                    u_bioentity = vertexname2bioentity[u]
                    for v in step2vertices[step_id]:
                        v_bioentity = vertexname2bioentity[v]
                        if contains(u_bioentity, v_bioentity) or contains(v_bioentity, u_bioentity):
                            g.add_edge(u, v)

#     for subproject in project["projects"]:
#         if "disabled" in subproject and subproject["disabled"] == True: continue
#         
#         dataset = subproject["dataset"]
#         subproject_id = dataset["id"]
#         
#         # Automatically find the pipeline which best suits this subproject
#         pipeline = None
#         compatible_pipelines = []
#         for pipe in project["pipelines"]:
#             if pipe == dataset["pipeline"]:
#                 pipeline = pipe
#                 break
#             
#             print(dataset["tags"], pipe["tags"])
#             if tags_compatibles(dataset["tags"], pipe["tags"]):
#                 compatible_pipelines.append(pipe)
#                 
#         if len(compatible_pipelines) == 0:
#             print("[WARNING] No compatible pipeline found for this subproject={}".format(dataset["id"]))
#         pipeline = compatible_pipelines[0]
#         if len(compatible_pipelines) > 1:
#             print("[WARNING] More than 1 compatible pipeline found ({} found) for this subproject={}".format(len(compatible_pipelines), dataset["id"]))
#         
#         # Create project base dir
#         subproject_dir = script_dir + "/" + subproject_id
#         if not os.path.exists(subproject_dir):
#             os.makedirs(subproject_dir)
#         
#         # Create a file with all the sample ids
#         dataset_writer = open(subproject_dir + "/dataset.txt", "w")
#         for sample in dataset["sample_ids"].split("\n"):
#             dataset_writer.write(sample + "\n")
#         dataset_writer.close()
#         
#         # Generate single scripts (per-sample or per-step)
#         for step in pipeline["steps"]:
#             if step["skip"]: continue
#             
#             if step["type"] == "per-step":
#                 create_step_all_samples(subproject_id, subproject_dir, step, dataset, pipeline)
#             elif step["type"] == "per-sample":
#                 create_allsteps_single_sample(subproject_id, subproject_dir, step, dataset, pipeline)
#         
#         for step in pipeline["steps"]:
#             stepname2step[step["title"]] = step
#             
#             if step["type"] == "per-step":
#                 name = step["title"]
#                 v = name
#                 g.add_node(v)
#                 name2vertex[name] = v
#                 vertex2name[v] = name
#                 vertexname2step[name] = step
#                 
#             elif step["type"] == "per-sample":
#                 for sample in dataset["sample_ids"].split("\n"):
#                     name = step["title"] + "-" + sample
#                     v = name
#                     g.add_node(v)
#                     name2vertex[name] = v
#                     vertex2name[v] = name
#                     vertexname2step[name] = step
#         
#         for step in pipeline["steps"]:
#             if step["type"] == "per-step":
#                 name = step["title"]
#                 v = name2vertex[name]
#                 for dep in step["hpc_directives"]["dependencies"]:
#                     dep_step = stepname2step[dep]
#                     if dep_step["skip"]: continue
#                     
#                     # 1 -> 1
#                     if dep_step["type"] == "per-step":
#                         name = dep_step["title"]
#                         u = name2vertex[name]
#                         g.add_edge(u, v)
#                     
#                     # molti -> 1     
#                     elif dep_step["type"] == "per-sample":
#                         name = dep_step["title"] + "-" + sample
#                         for sample in dataset["sample_ids"].split("\n"):
#                             name = dep_step["title"] + "-" + sample
#                             u = name2vertex[name]
#                             g.add_edge(u, v)
#                     
#             elif step["type"] == "per-sample":
#                 for sample in dataset["sample_ids"].split("\n"):
#                     name = step["title"] + "-" + sample
#                     v = name2vertex[name]
#                     for dep in step["hpc_directives"]["dependencies"]:
#                         dep_step = stepname2step[dep]
#                         if dep_step["skip"]: continue
#                         
#                         # 1 -> 1
#                         if dep_step["type"] == "per-step":
#                             name = dep_step["title"]
#                             u = name2vertex[name]
#                             g.add_edge(u, v)
#                         
#                         # molti -> 1     
#                         elif dep_step["type"] == "per-sample":
#                             name = dep_step["title"] + "-" + sample
#                             u = name2vertex[name]
#                             g.add_edge(u, v)
#                             
#         print("#" * 100)
#         
        # Simplify by removing skip nodes
    vertices_to_remove = set()
#         for step in pipeline["steps"]:
#             if step["skip"]:
#                 if step["type"] == "per-step":
#                     name = step["title"]
#                     v = name2vertex[name]
# 
#                     edges_to_remove = []
#                     for e_in in g.in_edges(v):
#                         fr = e_in[0]
#                         edges_to_remove.append(e_in)
#                         
#                         for e_out in g.out_edges(v):
#                             to = e_out[1]
#                             edges_to_remove.append(e_out)
#                             g.add_edge(fr, to)
#                     
#                     print("Removing", name)
#                     vertices_to_remove.add(v)
#                     for e in edges_to_remove:
#                         g.remove_edge(e[0], e[1])
#                     
#                 elif step["type"] == "per-sample":
#                     for sample in dataset["sample_ids"].split("\n"):
#                         name = step["title"] + "-" + sample
#                         #print("Trying to remove this step for sample=", sample, name)
#                         
#                         v = name2vertex[name]
#                         
#                         edges_to_remove = []
#                         for e_in in g.in_edges(v):
#                             fr = e_in[0]
#                             edges_to_remove.append(e_in)
#                             
#                             for e_out in g.out_edges(v):
#                                 to = e_out[1]
#                                 edges_to_remove.append(e_out)
#                                 g.add_edge(fr, to)
#                         
#                         for e in edges_to_remove:
#                             g.remove_edge(e[0], e[1])
#                         
#                         print("Removing", name, v)
#                         vertices_to_remove.add(v)

#         print("=== V (before) ===")
#         for v in g.nodes():
#             print(vertex2name[v])
            
    print("=== VERTICES TO REMOVE ===")
    for v in vertices_to_remove:
        print(vertex2name[v])
    for v in vertices_to_remove:
        g.remove_node(v)
    
#         print("=== V ===")
#         for v in g.nodes():
#             print(vertex2name[v])
    
    vertex2step = {}
    roots = []
    for v in g.nodes():
        name = vertex2name[v]
        step = vertexname2step[name]
        vertex2step[v] = step
        if g.in_degree(v) == 0:
            roots.append(v)
    
#     # Subproject .sh
#     filepath = subproject_dir + "/" + subproject_id +".sh"
#     file = open(filepath, "w")
#     file.write("#!/bin/bash\n\n")
#     file.write("# Project ID: {}\n".format(project["id"]))
#     file.write("# Title: {}\n".format(project["title"]))
#     file.write("# Subtitle: {}\n".format(project["subtitle"]))
#     file.write("# Description: {}\n".format(project["description"]))
#     file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
#     file.write("# Subproject ID: {}\n\n".format(subproject_id))
#     
#     file.write("declare -A JOB_IDS\n\n")
#     
#     # Graph BFS-search
#     bfs_edges = nx.bfs_edges(g, fake_root)
#     for e in bfs_edges:
#         u = e[1]
# 
#         step = vertex2step[u]
#         print("VISITING VERTEX={} STEP={} TYPE={}".format(vertex2name[u], step["title"], step["type"]))
#         
#         if step["type"] == "per-step":
#             single_step_allsamples_writer(step, file, vertex2name, dataset, pipeline, g, u)
#         elif step["type"] == "per-sample":
#             single_step_singlesample_writer(step, file, vertex2name, dataset, pipeline, g, u)
#     
#     file.close()
#     st = os.stat(filepath)
#     os.chmod(filepath, st.st_mode | stat.S_IEXEC)
    
    # Graph plot
    fake_root = "ROOT"
    g.add_node(fake_root)
    vertex2name[fake_root] = fake_root
    vertexname2step[fake_root] = fake_root
    
    for root in roots:
        g.add_edge(fake_root, root)
    dot_file = open(script_dir + "/graph.dot", "w")
    dot_file.write("digraph {\n")
#     print("Subproject", dataset["id"])
    vertices = []
    for v in g.nodes():
        s = vertex2name[v]
        vertices.append(s)
    print("=== DOT SUMMARY ===")
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
    format = "svg"
    command = "dot -T{} {}/graph.dot -o {}/graph.{}".format(format, script_dir, script_dir, format)
    ret_code = subprocess.run(command, shell=True)
    print("DOT CONVERSION:\nCommand: {}\nReturn code: {}".format(command, ret_code))
    
    # Master script
    filepath = script_dir + "/data/" + project["id"] +".sh"
    file = open(filepath, "w")
    
    file.write("#!/bin/bash\n\n")
    file.write("# Project ID: {}\n".format(project["id"]))
    file.write("# Title: {}\n".format(project["title"]))
    file.write("# Subtitle: {}\n".format(project["subtitle"]))
    file.write("# Description: {}\n".format(project["description"]))
    file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
    file.write("declare -A JOB_IDS\n\n")
    file.write("BASEDIR=`pwd`\n")
    
    file.write("rm job_info\n")
    
    vertex2script = {}
    for v in g.nodes():
        name = vertex2name[v]
        if name == "ROOT": continue
        
        step = vertexname2step[name]
        bioentity = vertexname2bioentity[name]
         
        script_path = produce_script(v, vertex2name, project, pipeline, step, bioentity)
        vertex2script[v] = script_path
    
    # Graph BFS-search
    bfs_edges = nx.bfs_edges(g, fake_root)
    for e in bfs_edges:
        v = e[1]
        name = vertex2name[v]
        
        script_path = vertex2script[v]
        final_script_path = script_path.replace(os.path.dirname(__file__) + "/scripts/" + project["id"] + "/data/", "")
        sh_name = final_script_path.split("/")[-1]
        basename = '/'.join(final_script_path.split("/")[0:-1])
        
        step = vertexname2step[name]
        bioentity = vertexname2bioentity[name]
        
#         print("VISITING VERTEX={}".format(vertex2name[v]))
        
        file.write("\n#{}\n#{} {} {}\n#{}\n".format("="*75, "="*25, name, "="*25, "="*75))
        
        dependencies = [e_in[0] for e_in in g.in_edges(v) if vertex2name[e_in[0]] is not "ROOT"]
        if dependencies:
            file.write("DEPS=()\n")
            for dep in dependencies:
                dep_name = vertex2name[dep]
                 
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
cd {}
sh_file="{}"
echo "DEPENDENCIES($sh_file)=" ${{DEPS[@]}}
set -o xtrace
if [[ ! -z "$DEPS" ]]
then
    job_long_name=$(sbatch --depend=afterany$(printf ":%s" "${{DEPS[@]}}") ./"$sh_file")
else
    job_long_name=$(sbatch ./"$sh_file")
fi

cd $BASEDIR
 
job_id=$(echo $job_long_name | cut -d' ' -f4)
echo "$sh_file => $job_id"
JOB_IDS["{}"]=$job_id

echo -e $job_id'\\t'"{}"'\\t'"{}"'\\t'"{}" >> job_info

set +o xtrace
""".format(basename, sh_name, name, name, bioentity["id"], bioentity["type"])
    
        else:
            script = """
cd {}
sh_file="{}"
set -o xtrace
job_long_name=$(sbatch ./"$sh_file")
job_id=$(echo $job_long_name | cut -d' ' -f4)
echo "$sh_file => $job_id"
cd $BASEDIR
JOB_IDS["{}"]=$job_id

echo -e $job_id'\\t'"{}"'\\t'"{}"'\\t'"{}" >> job_info

set +o xtrace
""".format(basename, sh_name, name, name, bioentity["id"], bioentity["type"])
        
        file.write(script)
        
    # Keep track of submitted jobs
    file.write('\nrm job_ids; for x in "${JOB_IDS[@]}"; do echo $x >> job_ids; done\n')
    file.write('date -I > run_info\n')
        
    file.close()
    st = os.stat(filepath)
    os.chmod(filepath, st.st_mode | stat.S_IEXEC)
    
#     for subproject in project["projects"]:
#         subproject_id = subproject["id"]
#         file.write("echo '{}\n{}  Analysing subproject {}  {}\n{}\n'\n".format('#'*50, '#'*3, subproject_id, '#'*3, '#'*50))
#         file.write("cd {}\n".format(subproject_id))
#         file.write("./{}.sh\n".format(subproject_id))
#         file.write("cd ..\n")
#     file.close()
#     st = os.stat(filepath)
#     os.chmod(filepath, st.st_mode | stat.S_IEXEC)
    
    total_experiments = 0
    total_runs = 0
    for bioproject in project["projects"]:
        total_experiments += len(bioproject["experiments"])
        for experiment in bioproject["experiments"]:
            total_runs += len(experiment["dataset"]["sample_ids"])
    
    filepath = script_dir + "/data/info"
    file = open(filepath, "w")
    file.write("PROJECT_NAME={}\n".format(project["id"]))
    file.write("PROJECT_DESCRIPTION={}\n".format(project["description"]))
    file.write("PROJECT_CREATION_DATE={}\n".format(project["creation_date"]))
    file.write("NUM_BIOPROJECT={}\n".format(len(project["projects"])))
    file.write("NUM_EXPERIMENTS={}\n".format(total_experiments))
    file.write("NUM_RUNS={}\n".format(total_runs))
    file.write("NUM_PIPELINES={}\n".format(len(project["pipelines"])))
    file.close()
    
    # Write the monitor script
    filepath = script_dir + "/data/monitor.sh"
    file = open(filepath, "w")
    file.write("""
CLUSTER=`hostname -f | cut -d'.' -f 2-`
BASE_DIR="/gss/gss_work/DRES_wrkgalax/pipeline_monitor/$CLUSTER/"
PROJECT_NAME=`grep "PROJECT_NAME" info | cut -d'=' -f 2`
TARGET_DIR=$BASE_DIR$PROJECT_NAME

if [ ! -d "$TARGET_DIR" ]
then
        mkdir -p "$TARGET_DIR"
fi

TARGET_FILE="$TARGET_DIR/$PROJECT_NAME.monitor"

sacct -P --delimiter="\t" --starttime "`cat run_info`" --format="JobID,ExitCode,User,Time,Elapsed,State,JobName%50" | grep -v "batch" | grep -v "extern" > tmp
cat tmp | head -n 1 | tr '\n' '\t' > header1
cat tmp | grep -f job_ids > body
echo -e "NodeName"'\t'"BioentityID"'\t'"BioentityType" > header2

# Filter out the jobs which do not belong to this project
join -j 1 -t '\t' body job_info > prefinal
cat header1 header2 > header
cat header prefinal > "$TARGET_FILE"
rm tmp header1 header2 header body prefinal

echo "Statistics written to: $TARGET_FILE"
    """)
    file.close()
    st = os.stat(filepath)
    os.chmod(filepath, st.st_mode | stat.S_IEXEC)
    
    # Archive production
    archive_name = script_dir
    archive_path = script_dir + "/" + archive_name + '.zip'
    if os.path.exists(archive_path): os.remove(archive_path)
    shutil.make_archive(archive_name, 'zip', script_dir)
    
    return HttpResponse("Scripts correctly created for project: '{}'".format(project["id"]))

def replace_variables(x, project, bioproject, experiment, pipeline, step, bioentity):
    print("REPLACE_VARIABLES", x, step["title"], bioentity["id"])
    
    for variable in pipeline["variables"]:
        if "key_disabled" in variable and variable["key_disabled"] is True:
            k = variable["key"]
            v = None
            
            if k == "sample_variable":
                v = bioentity["id"]
            if k == "experiment_variable":
                if experiment is not None:
                    v = experiment["id"]
            if k == "project_variable":
                if bioproject is not None:
                    v = bioproject["id"]
            if k == "ALL_SAMPLES":
                v = k
            if k == "cpu_variable":
                v = str(step["hpc_directives"]["cpu"])
            if k == "STEP_NAME":
                v = step["title"]
            
            if v is not None:
                if k in x:
                    print("\tREPLACING", k, v, "in", x)
                    x = x.replace("${"+str(k)+"}", v)
                    x = x.replace("$"+str(k), v)
            
        else:
            x = x.replace("${"+variable["key"]+"}", variable["value"])
            x = x.replace("$"+variable["key"], variable["value"])
        
    return x

def invoke_monitor(request):
    
    #identity_file = os.path.dirname(__file__) + "/../../../pipeline_id_rsa"
    identity_file = "/pipeline_id_rsa"
    
    project = json.loads(request.body.decode('utf-8'))
    id = project["id"]
    
    username = project["pipelines"][0]["username"]
    cluster = project["pipelines"][0]["cluster"] + ".cineca.it"
    remote_path = project["pipelines"][0]["remote_path"]
    
    # monitor_dir = os.path.dirname(__file__) + "/clusters/" + cluster + "/" + id + "/"
    monitor_dir = os.path.dirname(__file__) + "/temp/"
    monitor_data = monitor_dir + id + ".monitor"
    
    result = execute_remote_command(["scp", "-i " + identity_file, username+"@"+"login."+cluster+":"+remote_path + "/data/"+id+".monitor", monitor_data])
    if result["exit_code"] == 1:
        print(result)
        return HttpResponse(json.dumps(result))
    
    print("Loading statistics from file={}".format(monitor_data))
    
    job_status_file = os.path.dirname(__file__) + "/utils/job_statuses.txt"
    
    job_codes = {}
    with open(job_status_file) as f:
        for line in f:
            fields = line.strip().split("\t")
            job_codes[fields[1]] = {"id": fields[1], "code": fields[0], "description": fields[2], "color": fields[3]}
    
    header = []
    data = []
    with open(monitor_data, "r") as f:
        for line in f:
            fields = line.strip().split("\t")
            if not header:
                header = fields
            else:
                info = {}
                for i in range(len(header)):
                    k = header[i]
                    v = fields[i]
                    info[k] = v
                
                info["State"] = job_codes[info["State"].split(" ")[0]]
                data.append(info)
    
    return HttpResponse(json.dumps(data))


# def create_step_all_samples(subproject_id, subproject_dir, step, dataset, pipeline):
#     directives = step["hpc_directives"]
#     #sample_variable = dataset["sample_variable"]
#     variables = pipeline["variables"]
#     sample_variable = next(filter(lambda x: x['key'] == "sample_variable", variables))["value"]
#     
#     sh_name = step["title"]+".sh"
#     filepath = subproject_dir + "/" + sh_name
#     
#     file = open(filepath, "w")
#     
#     file.write("#!/bin/bash\n\n")
#     file.write("# Description: {}\n".format(step["description"]))
#     file.write("# Short description: {}\n\n".format(step["description_short"]))
#     file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
#     
#     job_name = directives["job_name"]
#     job_name = replace_variables(job_name, variables)
#     job_name = job_name.replace("${PROJECT}", subproject_id)
# #     job_name = job_name.replace("${GENOME}", genome)
#     job_name = job_name.replace("${STEP_NAME}", step["title"].replace(" ", "_"))
# #     job_name = job_name.replace("${{{}}}".format(sample_variable), sample)
#     
#     file.write("#SBATCH --job-name={}\n".format(job_name))
#     file.write("#SBATCH -N {}\n".format(directives["nodes"]))
#     file.write("#SBATCH -n {}\n".format(directives["cpu"]))
#     #file.write("#SBATCH -n {}\n".format(directives["mpi_procs"]))
#     file.write("#SBATCH -p {}\n".format(directives["queue"]))
#     file.write("#SBATCH --mem={}{}\n".format(directives["memory"]["quantity"], directives["memory"]["size"]))
#     file.write("#SBATCH --time {}\n".format(directives["walltime"]))
#     file.write("#SBATCH --account {}\n".format(directives["account"]))
#     
#     if "error" not in directives or directives["error"] == "":
# #         directives["error"] = step["title"] + ".err"
#         pass
#     else:
#         directives["error"] = replace_variables(directives["error"], variables)
#         directives["error"] = directives["error"].replace("${STEP_NAME}", step["title"])
#         file.write("#SBATCH --error {}\n".format(directives["error"].replace(" ", "-")))
#     
#     if "output" not in directives or directives["output"] == "":
# #         directives["output"] = step["title"] + ".out"
#         pass
#     else:
#         directives["output"] = replace_variables(directives["output"], variables)
#         directives["output"] = directives["output"].replace("${STEP_NAME}", step["title"])
#         file.write("#SBATCH --output {}\n".format(directives["output"].replace(" ", "-")))
#     
#     file.write("cd $SLURM_SUBMIT_DIR\n\n")
#     
#     file.write("\n\n# Module(s) loading\n\n")
#     
#     for module in step["modules"]:
#         file.write("module load autoload {}\n".format(module))
#     
#     file.write("\n\n# Command line(s)\n\n")
#     
#     if step["iterate"]:
#         file.write("""
# for {} in `cat "dataset.txt"`
# do\n
# """.format(sample_variable))
#                 
#     conditions = step["conditions"]
#     if conditions:
#         for condition in conditions:
#             file.write("""
#     {}
#     step_condition=$?
#     echo "{}"
#     echo {} $step_condition
#     if [ "$step_condition" -eq 0 ]
#     then
#         continue
#     fi
#     
# """.format(condition["command"], condition["command"], step["title"]))
#     
#     if step["iterate"]:
#         file.write("    if [ ! -d ${} ] ; then mkdir ${}; fi\n".format(sample_variable, sample_variable))
#     
#     file.write("    set +o xtrace;\n    {}".format(step["commandline"]))
#     
#     if "write_stdout_log" in step and step["write_stdout_log"]:
#         file.write(" >\"${}/{}.out\"".format(sample_variable, step["title"]))
# 
#     if "write_stderr_log" in step and step["write_stderr_log"]:
#         file.write(" 2>\"${}/{}.err\"".format(sample_variable, step["title"]))
#     
#     if "sequential" not in step or step["sequential"] == False:
#         file.write(" &")
#         
#     file.write("\n")
#     
#     if step["iterate"]:
#         file.write("""
# done
# wait
# """)
#                 
#     file.close()
#     
#     st = os.stat(filepath)
#     os.chmod(filepath, st.st_mode | stat.S_IEXEC)

# def create_allsteps_single_sample(subproject_id, subproject_dir, step, dataset, pipeline):
#     directives = step["hpc_directives"]
#     variables = pipeline["variables"]
#     sample_variable = next(filter(lambda x: x['key'] == "sample_variable", variables))["value"]
#     
#     for sample in dataset["sample_ids"].split("\n"):
#         sh_name = step["title"] + "-" + sample + ".sh"
#         
#         filepath = subproject_dir + "/" + sh_name
#         
#         file = open(filepath, "w")
#         
#         file.write("#!/bin/bash\n\n")
#         file.write("# Description: {}\n".format(step["description"]))
#         file.write("# Short description: {}\n\n".format(step["description_short"]))
#         file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
#         
#         job_name = directives["job_name"]
#         job_name = replace_variables(job_name, variables)
#         job_name = job_name.replace("${PROJECT}", subproject_id)
# #         job_name = job_name.replace("${GENOME}", genome)
#         job_name = job_name.replace("${STEP_NAME}", step["title"].replace(" ", "_"))
#         job_name = job_name.replace("${{{}}}".format(sample_variable), sample)
#         
#         file.write("#SBATCH --job-name={}\n".format(job_name))
#         file.write("#SBATCH -N {}\n".format(directives["nodes"]))
#         file.write("#SBATCH -n {}\n".format(directives["cpu"]))
#         #file.write("#SBATCH -n {}\n".format(directives["mpi_procs"]))
#         file.write("#SBATCH -p {}\n".format(directives["queue"]))
#         file.write("#SBATCH --mem={}{}\n".format(directives["memory"]["quantity"], directives["memory"]["size"]))
#         file.write("#SBATCH --time {}\n".format(directives["walltime"]))
#         file.write("#SBATCH --account {}\n".format(directives["account"]))
#         
#         if "error" not in directives or directives["error"] == "":
# #             directives["error"] = step["title"]
#             pass
#         else:
#             directives["error"] = directives["error"].replace("${STEP_NAME}", step["title"])
#             file.write("#SBATCH --error {}\n".format(sample + "-" + directives["error"].replace(" ", "-")))
#             
#         if "output" not in directives or directives["output"] == "":
# #             directives["output"] = step["title"]
#             pass
#         else:
#             directives["output"] = directives["output"].replace("${STEP_NAME}", step["title"])
#             file.write("#SBATCH --output {}\n".format(sample + "-" + directives["output"].replace(" ", "-")))
#         
#         file.write("cd $SLURM_SUBMIT_DIR\n\n")
#         
#         file.write("\n\n# Module(s) loading\n\n")
#         
#         for module in step["modules"]:
#             file.write("module load autoload {}\n".format(module))
#         
#         file.write("\n\n# Command line(s)\n\n")
#         
#         file.write("{}=\"{}\"\n\n".format(sample_variable, sample))
#         
#         conditions = step["conditions"]
#         if conditions:
#             for condition in conditions:
#                 
#                 command = condition["command"]
#                 #command = command.replace("${SAMPLE}", sample)
#                 
#                 file.write("""
# {}
# step_condition=$?
# echo "{}"
# echo {} {} $step_condition
# if [ "$step_condition" -eq 0 ]
# then
#     exit
# fi
# """.format(command, sample, command, step["title"]))
#         
#         file.write("if [ ! -d ${} ] ; then mkdir ${}; fi\n".format(sample_variable, sample_variable))
#         
#         file.write("set +o xtrace; {}".format(step["commandline"]))
#     
#         if "write_stdout_log" in step and step["write_stdout_log"]:
#             file.write(" >\"${}/{}.out\"".format(sample_variable, step["title"]))
# 
#         if "write_stderr_log" in step and step["write_stderr_log"]:
#             file.write(" 2>\"${}/{}.err\"".format(sample_variable, step["title"]))
#                             
#         file.close()
#         
#         st = os.stat(filepath)
#         os.chmod(filepath, st.st_mode | stat.S_IEXEC)
    
def download_scripts(request):
    project = json.loads(request.body.decode('utf-8'))
    return HttpResponse(json.dumps(
        {
            "url": "download/" + project["id"] + ".zip",
            "filename": project["id"] + ".zip"
         }))

def execute_remote_command(COMMAND, messageOK="", ignore_output=False):
    print("Executing command:" + " ".join(COMMAND))
    
    p = subprocess.Popen(COMMAND,
                       shell=False,
                       stdout=subprocess.PIPE,
                       stderr=subprocess.PIPE)
    
    try:
        stdout, stderr = p.communicate()
        ret_code = p.returncode
        if ret_code != 0:
            return {"type": "warning", "exit_code": ret_code, "message": "Exit code: " + str(ret_code) + " Message: '" + str(stderr.decode("utf-8").strip() + "'")}
        else:
            output = messageOK
            if not ignore_output:
                out = str(stdout.decode("utf-8").strip())
                if out != "":
                    output = out
                    
            return {"type": "success", "exit_code": ret_code, "message": output}
    except Exception as e:
        print(e)
        return {"type": "error", "message": str(e)}

def launch_scripts(request):
    project = json.loads(request.body.decode('utf-8'))
    
    print("PWD", os.getcwd())
    
    produce_scripts(request)
    
    hostname = "login." + project["pipelines"][0]["cluster"] + ".cineca.it"
    
    if "username" not in project["pipelines"][0]:
        HttpResponse(json.dumps([{"type": "error", "message": "Please specify a username"}]))
    if "remote_path" not in project["pipelines"][0]:
        HttpResponse(json.dumps([{"type": "error", "message": "Please specify a directory where to transfer the scripts"}]))
        
    username = project["pipelines"][0]["username"]
    remote_path = project["pipelines"][0]["remote_path"]
    project_archive_name = project["id"] + ".zip"
    project_archive = os.path.dirname(__file__) + "/scripts/" + project_archive_name
    
    results = []
    
    results.append(execute_remote_command(["ssh", "-i ./pipeline_id_rsa", "-oPasswordAuthentication=no", username + "@" + hostname, "bash -c 'mkdir "+remote_path+"'"], "Directory " + remote_path + " correctly created."))
    if results[-1]["exit_code"] == 0 or results[-1]["exit_code"] == 1:
        results.append(execute_remote_command(["scp", "-i ./pipeline_id_rsa", "-oPasswordAuthentication=no", project_archive, username + "@" + hostname + ":" + remote_path], "Project files correctly transferred to " + remote_path))
    if results[-1]["exit_code"] == 0:
        results.append(execute_remote_command(["ssh", "-i ./pipeline_id_rsa", "-oPasswordAuthentication=no", username + "@" + hostname, "bash -c 'cd "+ remote_path + "; unzip -o " + project_archive_name + "'"], "Project files correctly unzipped", ignore_output=True))    
    if results[-1]["exit_code"] == 0:
        results.append(execute_remote_command(["ssh", "-i ./pipeline_id_rsa", "-oPasswordAuthentication=no", username + "@" + hostname, "bash -c 'cd "+ remote_path + "; cd data; ./"+project["id"]+".sh &> "+project["id"]+".log'"], "Project launched!", ignore_output=True))    
        results.append(execute_remote_command(["ssh", "-i ./pipeline_id_rsa", "-oPasswordAuthentication=no", username + "@" + hostname, "bash -c 'cd "+ remote_path + "; cd data; ./monitor.sh'"], "Monitor launched!", ignore_output=True))        
    
    return HttpResponse(json.dumps(results))

def download_csv(request):
    project = json.loads(request.body.decode('utf-8'))
    
    script_dir = os.path.dirname(__file__) + "/scripts/" + project["id"]
    if not os.path.exists(script_dir):
        os.makedirs(script_dir)
    
#     bioproject2srr = {}
#     for bioproject in project["projects"]:
#         for exp in bioproject["experiments"]:
#             bioproject_id = exp["dataset"]["bioproject_id"]
#             if bioproject_id not in bioproject2srr: bioproject2srr[bioproject_id] = []
#             bioproject2srr[bioproject_id].append(exp)
    
#     for bioproject_id in bioproject2srr:
#         groups = bioproject2srr[bioproject_id]

    for bioproject in project["projects"]:
        
        bioproject_id = bioproject["id"]
        
        attribute_keys = set()
        for exp in bioproject["experiments"]:
            for attribute_key in exp["dataset"]["attributes"].keys():
                attribute_keys.add(attribute_key)
        
        attribute_keys_to_remove = []
        for attribute_key in attribute_keys:
            attribute_values = Counter()
            for exp in bioproject["experiments"]:
                if attribute_key in exp["dataset"]["attributes"]:
                    value = exp["dataset"]["attributes"][attribute_key]
                    attribute_values[value] += 1
                        
            if len(attribute_values.keys()) == 1:
                print("Discarding column {} for ProjectID={} (not discriminating) Total={} Counter={}".format(attribute_key, bioproject_id, len(bioproject["experiments"]), attribute_values))
                attribute_keys_to_remove.append(attribute_key)
        
        for attribute_key in attribute_keys_to_remove:
            attribute_keys.remove(attribute_key)
        
        csv_writer = open(script_dir + "/" + bioproject_id + ".csv", "w")
        csv_writer.write("ids," + ",".join([a.replace(" ", "_") for a in attribute_keys]) + "\n")
        for exp in bioproject["experiments"]:
            fields = []
            fields.append(exp["id"])
            for attribute_key in attribute_keys:
                value = ""
                if attribute_key in exp["dataset"]["attributes"]:
                    value = exp["dataset"]["attributes"][attribute_key]
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
    
