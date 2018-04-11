from django.shortcuts import render
from django.http import HttpResponse
import json
import os
import time
import glob
import datetime
import stat
import shutil

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
    
    file_scripts = []
    
    for subproject in project["projects"]:
        
        # Create project base dir
        subproject_id = subproject["dataset"]["id"]
        
        subproject_dir = script_dir + "/" + subproject_id
        if not os.path.exists(subproject_dir):
            os.makedirs(subproject_dir)
        
        subproject_file_scripts = []
        
        if "type" not in subproject or subproject["type"] == "per-step":
            
            for step in subproject["steps"]:
                
                directives = step["hpc_directives"]
                
                sh_name = step["title"]+".sh"
                filepath = subproject_dir + "/" + sh_name
                subproject_file_scripts.append(sh_name)
                
                file = open(filepath, "w")
                
                file.write("#!/bin/bash\n\n")
                file.write("# Description: {}\n".format(step["description"]))
                file.write("# Short description: {}\n\n".format(step["description_short"]))
                file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
                
                file.write("#SBATCH --job-name={}\n".format(directives["job_name"]))
                file.write("#SBATCH -N {}\n".format(directives["nodes"]))
                file.write("#SBATCH -n {}\n".format(directives["cpu"]))
                #file.write("#SBATCH -n {}\n".format(directives["mpi_procs"]))
                file.write("#SBATCH -p {}\n".format(directives["queue"]))
                file.write("#SBATCH --mem={}{}\n".format(directives["memory"]["quantity"], directives["memory"]["size"]))
                file.write("#SBATCH --time {}\n".format(directives["walltime"]))
                file.write("#SBATCH --account {}\n".format(directives["account"]))
                file.write("#SBATCH --error {}\n".format(directives["error"]))
                file.write("#SBATCH --output {}\n".format(directives["output"]))
                
                file.write("\n\n# Module(s) loading\n\n")
                
                for module in step["modules"]:
                    file.write("module load {}\n".format(module))
                
                file.write("\n\n# Command line(s)\n\n")
                
                for sample in subproject["dataset"]["sample_ids"].split("\n"):
                    file.write("{} &\n".format(step["commandline"].replace("$"+subproject["dataset"]["sample_variable"], sample)))
                
                file.write("wait")
                
                file.close()
                
                st = os.stat(filepath)
                os.chmod(filepath, st.st_mode | stat.S_IEXEC)
        
        # Subproject .sh
        filepath = subproject_dir + "/" + subproject_id +".sh"
        file = open(filepath, "w")
        file.write("#!/bin/bash\n\n")
        file.write("# Project ID: {}\n".format(project["id"]))
        file.write("# Title: {}\n".format(project["title"]))
        file.write("# Subtitle: {}\n".format(project["subtitle"]))
        file.write("# Description: {}\n".format(project["description"]))
        file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
        file.write("# Subproject ID: {}\n".format(subproject_id))
        for file_script in subproject_file_scripts:
            file.write("sbatch ./{}\n".format(file_script))
        file.close()
        st = os.stat(filepath)
        os.chmod(filepath, st.st_mode | stat.S_IEXEC)
        
        file_scripts.append(subproject_id + "/" + subproject_id +".sh")
    
    # Project .sh
    filepath = script_dir + "/" + project["id"] +".sh"
    file = open(filepath, "w")
    file.write("#!/bin/bash\n\n")
    file.write("# Project ID: {}\n".format(project["id"]))
    file.write("# Title: {}\n".format(project["title"]))
    file.write("# Subtitle: {}\n".format(project["subtitle"]))
    file.write("# Description: {}\n".format(project["description"]))
    file.write("# Creation time: {}\n\n".format(datetime.datetime.now()))
    for file_script in file_scripts:
        file.write("./{}\n".format(file_script))
    file.close()
    st = os.stat(filepath)
    os.chmod(filepath, st.st_mode | stat.S_IEXEC)
    
    shutil.make_archive(script_dir, 'zip', script_dir)
    
    return HttpResponse("Scripts correctly created for project: '{}'".format(project["id"]))

def download_scripts(request):
    project = json.loads(request.body.decode('utf-8'))
    return HttpResponse(json.dumps(
        {
            "url": "download/" + project["id"] + ".zip",
            "filename": project["id"] + ".zip"
         }))
