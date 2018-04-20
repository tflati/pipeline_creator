from django.shortcuts import render
from django.http import HttpResponse
import json
import os
import time
import glob
import datetime
import stat
import shutil
from graph_tool.all import *

class MyBFSVisitor(graph_tool.search.BFSVisitor):
    def __init__(self, vertex2step, file, dataset, vertex2name):
        self.vertex2step = vertex2step
        self.file = file
        self.dataset = dataset
        self.vertex2name = vertex2name
        
    def examine_vertex(self, u):
        """
        Called when edge is checked
        """
        if self.vertex2name[u] == "ROOT":
            print("VISITING SPECIAL ROOT")
            return
        
        step = self.vertex2step[u]
        print("VISITING", self.vertex2name[u], step["title"], step["type"])
        
        if step["type"] == "per-step":
            single_step_allsamples_writer(step, self, u)
        elif step["type"] == "per-sample":
            single_step_singlesample_writer(step, self, u)
        
def single_step_allsamples_writer(step, self, u):
    
    sample_variable = self.dataset["sample_variable"]
    
    sh_file = step["title"]+".sh"
        
    self.file.write("##########################\n######  {}  ########\n##########################\n".format(step["title"]))
    
    self.file.write("execute=1\n")
    
    # Add the run-time conditions to check before launching the command
    conditions = step["conditions"]
    if conditions:
        for condition in conditions:
            
            self.file.write(
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
    self.file.write("DEPS=()\n")
    for dep in u.in_neighbors():
        dep_name = self.vertex2name[dep]
        
        dep_script = """
DEP_JOB_NAME="{}"
echo $DEP_JOB_NAME
DEP_JOB_ID=${{JOB_IDS["$DEP_JOB_NAME"]}}
echo "DEPJOBID="$DEP_JOB_ID

if [ ! -z $DEP_JOB_ID ]
then
    DEPS+=($DEP_JOB_ID)
fi """.format(dep_name)
                
        self.file.write(dep_script)
            
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
        
    self.file.write(script)
    
def single_step_singlesample_writer(step, self, u):
    
    sample_variable = self.dataset["sample_variable"]
    
    for sample in self.dataset["sample_ids"].split("\n"):
        v_name = self.vertex2name[u]
        name = step["title"] + "-" + sample
        if v_name != name: continue
        
        sh_file = name + ".sh"
        
        self.file.write("\n\n\n##########################\n######  {}  ########\n##########################\n".format(name))
    
        self.file.write("execute=1\n")
    
        # Add the run-time conditions to check before launching the command
        conditions = step["conditions"]
        if conditions:
            for condition in conditions:
                command = condition["command"]
                command = command.replace("${{{}}}".format(sample_variable), sample)
                    
                self.file.write(
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
    break
fi

""".format(command, command, name, sample))

        # TODO - clearer: eventually write explicit variables called like: trimmomatic_job_long_name and concatenate
        # these to form the depend=afterany string
        self.file.write("DEPS=()\n")
        for dep in u.in_neighbors():
            dep_name = self.vertex2name[dep]
            
            dep_script = """
DEP_JOB_NAME="{}"
echo $DEP_JOB_NAME
DEP_JOB_ID=${{JOB_IDS["$DEP_JOB_NAME"]}}
echo "DEPJOBID="$DEP_JOB_ID

if [ ! -z $DEP_JOB_ID ]
then
    DEPS+=($DEP_JOB_ID)
fi

""".format(dep_name)
                
            self.file.write(dep_script)
            
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

        self.file.write(script)

def modules(request, cluster_id, prefix = None):
    modules = []

    last_module = ""
    last_category = ""
    
    for line in open(os.path.dirname(__file__) + "/utils/all_modules_" + cluster_id + ".txt"):
        line = line.rstrip()
        
        initial_tabs = len(line)-len(line.lstrip('\t'))
        if initial_tabs == 0:
            if line.startswith("Profile: "):
                line = line.replace("Profile: ", "")
                if prefix is None or line.lower().startswith(prefix.lower()) or "profile".startswith(prefix.lower()):
                    modules.append({"label": "profile/"+line})
                
        elif initial_tabs == 2:
            line = line.lstrip()
            last_category = line
            
        elif initial_tabs == 3:
            line = line.strip("\t")
            if not line.startswith(" "): last_module = line
            elif prefix is None or last_module.lower().startswith(prefix.lower()): modules.append({"label": last_module + "/" +line.strip(), "extra": last_category})
    
    return HttpResponse(json.dumps(modules))

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
    
    return HttpResponse("Project: '{}' correctly saved.".format(project_id))

def delete_project(request):
    data = json.loads(request.body.decode('utf-8'))
    project_id = data["id"]
    filepath = os.path.dirname(__file__) + "/data/"+project_id+".json"
    os.remove(filepath)
    
    return HttpResponse("Project: '{}' correctly removed.".format(project_id))

def produce_scripts(request):
    project = json.loads(request.body.decode('utf-8'))
    
    print(project)
    
    # Create project base dir
    script_dir = os.path.dirname(__file__) + "/scripts/" + project["id"]
    if not os.path.exists(script_dir):
        os.makedirs(script_dir)
    
    for subproject in project["projects"]:
        if "disabled" in subproject and subproject["disabled"] == True: continue
        
        dataset = subproject["dataset"]
        subproject_id = dataset["id"]
        
        genome = dataset["genome"] if "genome" in dataset else None
        
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
        for step in subproject["steps"]:
            if step["skip"]: continue
            
            if step["type"] == "per-step":
                create_step_all_samples(subproject_id, subproject_dir, genome, step, dataset)
            elif step["type"] == "per-sample":
                create_allsteps_single_sample(subproject_id, subproject_dir, genome, step, dataset)
        
        
#         for step in subproject["steps"]:
#             if step["type"] == "per-step":
#                 name = step["title"]
#                 vertexname2step[name] = step
#             elif step["type"] == "per-sample":
#                 for sample in dataset["sample_ids"].split("\n"):
#                     name = step["title"] + "-" + sample
#                     vertexname2step[name] = step
        
        # Initial graph setup
        g = Graph()
        name2vertex = {}
        vertexname2step = {}
        stepname2step = {}
        vertex2name = g.new_vertex_property("string")
        for step in subproject["steps"]:
            stepname2step[step["title"]] = step
            
            if step["type"] == "per-step":
                v = g.add_vertex()
                name = step["title"]
                name2vertex[name] = v
                vertex2name[v] = name
                vertexname2step[name] = step
                
            elif step["type"] == "per-sample":
                for sample in dataset["sample_ids"].split("\n"):
                    v = g.add_vertex()
                    name = step["title"] + "-" + sample
                    name2vertex[name] = v
                    vertex2name[v] = name
                    vertexname2step[name] = step
        
        for step in subproject["steps"]:
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
        for step in subproject["steps"]:
            if step["skip"]:
                if step["type"] == "per-step":
                    name = step["title"]
                    v = name2vertex[name]

#                     if v.in_degree() == v.out_degree() and v.in_degree() > 0:
#                         for e_in in v.in_edges():
#                             fr = e_in.source()
#                             g.remove_edge(e_in)
#                             
#                             fr_name = vertex2name[fr]
#                             sample_fr = fr_name.split("-")[-1]
#                             
#                             for e_out in v.out_edges():
#                                 to = e_out.target()
#                                 to_name = vertex2name[to]
#                                 sample_to = to_name.split("-")[-1]
#                                 if sample_to != sample_fr: continue
#                                 
#                                 g.remove_edge(e_out)
#                                 g.add_edge(fr, to)
#                     else:                
                    for e_in in v.in_edges():
                        fr = e_in.source()
                        g.remove_edge(e_in)
                        
                        for e_out in v.out_edges():
                            to = e_out.target()
                            g.remove_edge(e_out)
                            g.add_edge(fr, to)
                    
                    print("Removing", name, v)
                    g.remove_vertex(v)
                    
                elif step["type"] == "per-sample":
                    vertices_to_remove = []
                    for sample in dataset["sample_ids"].split("\n"):
                        name = step["title"] + "-" + sample
                        print("Trying to remove this step for sample=", sample, name)
                        
                        v = name2vertex[name]
                        
                        for e_in in v.in_edges():
                            fr = e_in.source()
                            print("Edge source", fr)
                            g.remove_edge(e_in)
                            
                            for e_out in v.out_edges():
                                to = e_out.target()
                                g.remove_edge(e_out)
                                g.add_edge(fr, to)                
                        
                        print("Removing", name, v)
                        vertices_to_remove.append(v)
                    for v in reversed(sorted(vertices_to_remove)):
                        g.remove_vertex(v)
        
        vertex2step = {}
        roots = []
        for v in g.vertices():
            name = vertex2name[v]
            step = vertexname2step[name]
            vertex2step[v] = step
            if v.in_degree() == 0:
                roots.append(v)
        
        fake_root = g.add_vertex()
        vertex2name[fake_root] = "ROOT"
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
        for v in g.vertices():
            s = vertex2name[v]
            vertices.append(s)
        print("V=", vertices)
        for vertex in vertices:
            dot_file.write("\"{}\"\n".format(vertex))
        
        edges = []
        for e in g.edges():
            u = vertex2name[e.source()]
            v = vertex2name[e.target()]
            edges.append(u+"->"+v)
            dot_file.write("\"{}\" -> \"{}\";\n".format(u, v))
        print("E=\n", "\n".join(edges))
        dot_file.write("\n}")
#         print("STEP2INT",name2vertex)
        
        # Save the graph as an image
        layout = sfdp_layout(g)
#         layout = planar_layout(g)
        graph_draw(GraphView(g, directed=True),
                   pos=layout,
                   vertex_text=vertex2name,
                   vertex_font_size=80,
                   output_size=(10000, 10000),
                   output=subproject_dir + "/" + subproject_id + ".svg")
        
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
        bfs_search(g, source=fake_root, visitor=MyBFSVisitor(vertex2step, file, dataset, vertex2name))
        
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
    
    shutil.make_archive(script_dir, 'zip', script_dir)
    
    return HttpResponse("Scripts correctly created for project: '{}'".format(project["id"]))

def create_step_all_samples(subproject_id, subproject_dir, genome, step, dataset):
    directives = step["hpc_directives"]
    sample_variable = dataset["sample_variable"]
    
    sh_name = step["title"]+".sh"
    filepath = subproject_dir + "/" + sh_name
    
    file = open(filepath, "w")
    
    file.write("#!/bin/bash\n\n")
    file.write("# Description: {}\n".format(step["description"]))
    file.write("# Short description: {}\n\n".format(step["description_short"]))
    file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
    
    job_name = directives["job_name"]
    job_name = job_name.replace("${PROJECT}", subproject_id)
    job_name = job_name.replace("${GENOME}", genome)
    file.write("#SBATCH --job-name={}\n".format(job_name))
    file.write("#SBATCH -N {}\n".format(directives["nodes"]))
    file.write("#SBATCH -n {}\n".format(directives["cpu"]))
    #file.write("#SBATCH -n {}\n".format(directives["mpi_procs"]))
    file.write("#SBATCH -p {}\n".format(directives["queue"]))
    file.write("#SBATCH --mem={}{}\n".format(directives["memory"]["quantity"], directives["memory"]["size"]))
    file.write("#SBATCH --time {}\n".format(directives["walltime"]))
    file.write("#SBATCH --account {}\n".format(directives["account"]))
    if "error" not in directives or directives["error"] == "": directives["error"] = step["title"] + ".err"
    file.write("#SBATCH --error {}\n".format(directives["error"].replace(" ", "-")))
    if "output" not in directives or directives["output"] == "": directives["output"] = step["title"] + ".out"
    file.write("#SBATCH --output {}\n".format(directives["output"].replace(" ", "-")))
    
    file.write("cd $SLURM_SUBMIT_DIR\n\n")
    
    file.write("\n\n# Module(s) loading\n\n")
    
    for module in step["modules"]:
        file.write("module load autoload {}\n".format(module))
    
    file.write("\n\n# Command line(s)\n\n")
    
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
    echo {} ${} $step_condition
    if [ "$step_condition" -eq 0 ]
    then
        continue
    fi
    
""".format(sample_variable, condition["command"], condition["command"], step["title"], sample_variable))
    
    file.write("    if [ ! -d ${} ] ; then mkdir ${}; fi\n".format(sample_variable, sample_variable))
    
    file.write("set +o xtrace;    {}".format(step["commandline"]))
    
    if "write_stdout_log" in step and step["write_stdout_log"]:
        file.write(" >\"${}/{}.out\"".format(sample_variable, step["title"]))

    if "write_stderr_log" in step and step["write_stderr_log"]:
        file.write(" 2>\"${}/{}.err\"".format(sample_variable, step["title"]))
    
    if "sequential" not in step or step["sequential"] == False:
        file.write(" &")
        
    file.write("\n")
    
    file.write("""
done
wait
""")
                
    file.close()
    
    st = os.stat(filepath)
    os.chmod(filepath, st.st_mode | stat.S_IEXEC)

def create_allsteps_single_sample(subproject_id, subproject_dir, genome, step, dataset):
    directives = step["hpc_directives"]
    sample_variable = dataset["sample_variable"]
    
    for sample in dataset["sample_ids"].split("\n"):
        sh_name = step["title"] + "-" + sample + ".sh"
        
        filepath = subproject_dir + "/" + sh_name
        
        file = open(filepath, "w")
        
        file.write("#!/bin/bash\n\n")
        file.write("# Description: {}\n".format(step["description"]))
        file.write("# Short description: {}\n\n".format(step["description_short"]))
        file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
        
        job_name = directives["job_name"]
        job_name = job_name.replace("${PROJECT}", subproject_id)
        job_name = job_name.replace("${GENOME}", genome)
        job_name = job_name.replace("${{{}}}".format(sample_variable), sample)
#         job_name += "-" + sample
        
        file.write("#SBATCH --job-name={}\n".format(job_name))
        file.write("#SBATCH -N {}\n".format(directives["nodes"]))
        file.write("#SBATCH -n {}\n".format(directives["cpu"]))
        #file.write("#SBATCH -n {}\n".format(directives["mpi_procs"]))
        file.write("#SBATCH -p {}\n".format(directives["queue"]))
        file.write("#SBATCH --mem={}{}\n".format(directives["memory"]["quantity"], directives["memory"]["size"]))
        file.write("#SBATCH --time {}\n".format(directives["walltime"]))
        file.write("#SBATCH --account {}\n".format(directives["account"]))
        
        if "error" not in directives or directives["error"] == "": directives["error"] = step["title"]
        file.write("#SBATCH --error {}\n".format(sample + "-" + directives["error"].replace(" ", "-")))
            
        if "output" not in directives or directives["output"] == "": directives["output"] = step["title"]
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
