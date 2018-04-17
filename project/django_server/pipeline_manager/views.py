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
    def __init__(self, int2step, file, dataset):
        self.int2step = int2step
        self.file = file
        self.dataset = dataset
        
    def examine_vertex(self, u):
        """
        Called when edge is checked
        """
        step = self.int2step[u]
        
        if step["type"] == "per-step":
            single_step_allsamples_writer(step, self, u)
        elif step["type"] == "per-sample":
            single_step_singlesample_writer(step, self, u)
        
def single_step_allsamples_writer(step, self, u):
    sh_file = step["title"]+".sh"
        
    self.file.write("##########################\n######{}########\n##########################\n".format(step["title"]))
    
    self.file.write("execute=1\n")
    
    # Add the run-time conditions to check before launching the command
    conditions = step["conditions"]
    if conditions:
        for condition in conditions:
            
            self.file.write(
"""
# Checking skip conditions
execute=0
for SAMPLE in `cat "dataset.txt"`
do
    {}
    step_condition=$?
    echo "{}"
    echo {} $SAMPLE $step_condition
    if [ "$step_condition" -eq 1 ]
    then
        execute=1
        break
    fi
done

""".format(condition["command"], condition["command"], step["title"]))

    # TODO - clearer: eventually write explicit variables called like: trimmomatic_job_long_name and concatenate
    # these to form the depend=afterany string
    self.file.write("DEPS=()\n")
    for dep in u.in_neighbors():
        dep_step = self.int2step[dep]
        
        dep_script = """
DEP_JOB_NAME="{}"
echo $DEP_JOB_NAME
DEP_JOB_ID=${{JOB_IDS["$DEP_JOB_NAME"]}}
echo $DEP_JOB_ID

if [ ! -z $DEP_JOB_ID ]
then
    DEPS+=($DEP_JOB_ID)
fi """.format(dep_step["title"])
                
        self.file.write(dep_script)
            
    script = """
sh_file="{}"
echo $sh_file "execute="$execute
if [ $execute -eq 1 ]
then
    echo ${{DEPS[@]}}
    set -o xtrace
    if [[ ! -z "$DEPS" ]]
    then
        job_long_name=$(sbatch --depend=afterany$(printf ":%s" "${{DEPS[@]}}") ./$sh_file)
    else
        job_long_name=$(sbatch ./$sh_file)
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
    
    for sample in self.dataset["sample_ids"].split("\n"):
        name = step["title"] + "-" + sample
        
        sh_file = step["title"]+".sh"
        
        self.file.write("##########################\n######{}########\n##########################\n".format(step["title"]))
    
        self.file.write("execute=1\n")
    
        # Add the run-time conditions to check before launching the command
        conditions = step["conditions"]
        if conditions:
            for condition in conditions:
                command = condition["command"]
                command = command.replace("${SAMPLE}", sample)
                    
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
            dep_step = self.int2step[dep]
            
            dep_script = """
DEP_JOB_NAME="{}"
echo $DEP_JOB_NAME
DEP_JOB_ID=${{JOB_IDS["$DEP_JOB_NAME"]}}
echo $DEP_JOB_ID

if [ ! -z $DEP_JOB_ID ]
then
    DEPS+=($DEP_JOB_ID)
fi """.format(dep_step["title"])
                
        self.file.write(dep_script)
            
    script = """
sh_file="{}"
echo $sh_file "execute="$execute
if [ $execute -eq 1 ]
then
    echo ${{DEPS[@]}}
    set -o xtrace
    if [[ ! -z "$DEPS" ]]
    then
        job_long_name=$(sbatch --depend=afterany$(printf ":%s" "${{DEPS[@]}}") ./$sh_file)
    else
        job_long_name=$(sbatch ./$sh_file)
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

def modules(request, prefix = None):
    modules = []

    last_module = ""
    
    for line in open(os.path.dirname(__file__) + "/utils/all_modules.txt"):
        line = line.rstrip()
        
        initial_tabs = len(line)-len(line.lstrip('\t'))
        if initial_tabs == 0:
            if line.startswith("Profile: "):
                line = line.replace("Profile: ", "")
                if prefix is None or line.lower().startswith(prefix.lower()) or "profile".startswith(prefix.lower()):
                    modules.append({"label": "profile/"+line})
                
        elif initial_tabs == 3:
            line = line.strip("\t")
            if not line.startswith(" "): last_module = line
            elif prefix is None or last_module.lower().startswith(prefix.lower()): modules.append({"label": last_module + "/" +line.strip()})
    
    return HttpResponse(json.dumps(modules))

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
        
        dataset = subproject["dataset"]
        subproject_id = dataset["id"]
        
        genome = dataset["genome"] if "genome" in dataset else None
        
        # Create project base dir
        subproject_dir = script_dir + "/" + subproject_id
        if not os.path.exists(subproject_dir):
            os.makedirs(subproject_dir)
            
        dataset_writer = open(subproject_dir + "/dataset.txt", "w")
        for sample in dataset["sample_ids"].split("\n"):
            dataset_writer.write(sample + "\n")
        dataset_writer.close()
        
        for step in subproject["steps"]:
            if step["skip"]: continue
            
            if step["type"] == "per-step":
                create_step_all_samples(subproject_id, subproject_dir, genome, step)
            elif step["type"] == "per-sample":
                create_allsteps_single_sample(subproject_id, subproject_dir, genome, step, dataset["sample_ids"].split("\n"))
        
        g = Graph()
        step2int = {}
        vertex_names = g.new_vertex_property("string")
        for step in subproject["steps"]:
            if step["type"] == "per-step":
                v = g.add_vertex()
                name = step["title"]
                step2int[name] = v
                vertex_names[v] = name
            elif step["type"] == "per-sample":
                for sample in dataset["sample_ids"].split("\n"):
                    v = g.add_vertex()
                    name = step["title"] + "-" + sample
                    step2int[name] = v
                    vertex_names[v] = name
            
        for step in subproject["steps"]:
            if step["type"] == "per-step":
                name = step["title"]
                v = step2int[name]
                for dep in step["hpc_directives"]["dependencies"]:
                     u = step2int[dep]
                     g.add_edge(u, v)
            elif step["type"] == "per-sample":
                for sample in dataset["sample_ids"].split("\n"):
                    name = step["title"] + "-" + sample
                    v = step2int[name]
                    for dep in step["hpc_directives"]["dependencies"]:
                        u = step2int[dep]
                        g.add_edge(u, v)
        
        print("#" * 100)
        
        print("Subproject", dataset["id"])         
        vertices = []
        for v in g.vertices():
#             s = int2step[v]
            s = vertex_names[v]
            vertices.append(s)
        print("V=", vertices)
        edges = []
        for e in g.edges():
            u = vertex_names[e.source()]
            v = vertex_names[e.target()]
            edges.append(u+"->"+v)
        print("E=\n", "\n".join(edges))
        print("STEP2INT",step2int)
            
        # Simplify by removing skip nodes
        for step in subproject["steps"]:
            if step["skip"]:
                if step["type"] == "per-step":
                    name = step["title"]
                    v = step2int[name]
                    
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
                        
                        v = step2int[name]
                    
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
        
        title2step = {}
        for step in subproject["steps"]:
            if step["type"] == "per-step":
                name = step["title"]
                title2step[name] = step
            elif step["type"] == "per-sample":
                for sample in dataset["sample_ids"].split("\n"):
                    name = step["title"] + "-" + sample
                    title2step[name] = step
            
        int2step = {}
        for v in g.vertices():
            name = vertex_names[v]
            int2step[v] = title2step[name]
        
        # Draw the graph
        graph_draw(GraphView(g, directed=True), pos=sfdp_layout(g), vertex_text=vertex_names, vertex_font_size=18, output=subproject_dir + "/" + subproject_id + ".svg")
        
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
        
        # Concrete job writer
        bfs_search(g, visitor=MyBFSVisitor(int2step, file, dataset))
        file.close()
        st = os.stat(filepath)
        os.chmod(filepath, st.st_mode | stat.S_IEXEC)
        
    # Project .sh
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

def create_step_all_samples(subproject_id, subproject_dir, genome, step):
    directives = step["hpc_directives"]
                
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
    file.write("#SBATCH --error {}\n".format(directives["error"]))
    file.write("#SBATCH --output {}\n".format(directives["output"]))
    
    file.write("cd $SLURM_SUBMIT_DIR\n\n")
    
    file.write("\n\n# Module(s) loading\n\n")
    
    for module in step["modules"]:
        file.write("module load autoload {}\n".format(module))
    
    file.write("\n\n# Command line(s)\n\n")
    
    file.write("""
for SAMPLE in `cat "dataset.txt"`
do\n
""")
                
    conditions = step["conditions"]
    if conditions:
        for condition in conditions:
            file.write("""
    {}
    step_condition=$?
    echo "{}"
    echo {} $SAMPLE $step_condition
    if [ "$step_condition" -eq 0 ]
    then
        continue
    fi
""".format(condition["command"], condition["command"], step["title"]))
                        
    file.write("""
    {} &
done
wait
""".format(step["commandline"]))
                
    file.close()
    
    st = os.stat(filepath)
    os.chmod(filepath, st.st_mode | stat.S_IEXEC)

def create_allsteps_single_sample(subproject_id, subproject_dir, genome, step, dataset):
    directives = step["hpc_directives"]
    
    for sample in dataset:
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
        job_name += "-" + sample
        
        file.write("#SBATCH --job-name={}\n".format(job_name))
        file.write("#SBATCH -N {}\n".format(directives["nodes"]))
        file.write("#SBATCH -n {}\n".format(directives["cpu"]))
        #file.write("#SBATCH -n {}\n".format(directives["mpi_procs"]))
        file.write("#SBATCH -p {}\n".format(directives["queue"]))
        file.write("#SBATCH --mem={}{}\n".format(directives["memory"]["quantity"], directives["memory"]["size"]))
        file.write("#SBATCH --time {}\n".format(directives["walltime"]))
        file.write("#SBATCH --account {}\n".format(directives["account"]))
        file.write("#SBATCH --error {}\n".format(sample + "-" + directives["error"]))
        file.write("#SBATCH --output {}\n".format(sample + "-" + directives["output"]))
        
        file.write("cd $SLURM_SUBMIT_DIR\n\n")
        
        file.write("\n\n# Module(s) loading\n\n")
        
        for module in step["modules"]:
            file.write("module load autoload {}\n".format(module))
        
        file.write("\n\n# Command line(s)\n\n")
        
        conditions = step["conditions"]
        if conditions:
            for condition in conditions:
                
                command = condition["command"]
                command = command.replace("${SAMPLE}", sample)
                
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
                            
        file.write("{}".format(step["commandline"]))
                    
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
