##########################################
##########################################
##### PIPELINER PROJECT CONFIGURATOR #####
##########################################
##########################################


##########################################
##########################################
####### SET YOUR VARIABLES HERE ##########
##########################################
##########################################

USERNAME="Titto"
PROJECT_ID = "Progetto di prova"
PROJECT_TITLE = ""
# SRA_DATASET = "PRJNA523118,PRJNA523119"
DATASET_PATH = "/home/flati/Downloads/mixed_dataset.xlsx"
PIPELINE_ID = "TranscriptomicsPipeline"
USER = "tflati00"
CLUSTER = "galileo"
REMOTE_PATH = "/gpfs/scratch/userexternal/tflati00/ProvaCommandLine"
GENOME_TYPE = "modules" # or "path"
GENOME = "ig_UCSC_Homo_sapiens/hg38" # or "/path/to/the/genome/"
PARTITION = 1
PARTITION_TAGS = [{"type": "experiment"}]
PARALLELISM = "10"

base_url = "http://localhost/pipeline_manager_api/pipeline_manager/"


##########################################
##########################################
############ DO NOT TOUCH ################
##########################################
##########################################

import requests
import sys
import json
import copy

# project = {
#     "id": PROJECT_ID,
#     "title": PROJECT_TITLE,
#     "subtitle": "",
#     "description": "",
#     "creator": USERNAME
# }


# # Create project
# command = "create_project/"
# resp = requests.post(base_url + command, json=project)
# if resp.status_code != 200:
#     raise Exception('POST {}/{}/ {}'.format(base_url, command, resp.status_code))
# print(resp.json())

# Create project
command = "load_project/"
resp = requests.get(base_url + command + PROJECT_ID + "/")
if resp.status_code != 200:
    raise Exception('POST {}/{}/ {}'.format(base_url, command, resp.status_code))
project = resp.json()

 
## Set dataset
# command = "upload_from_ID_list/"
# args = {"project": project, "list": SRA_DATASET}
# resp = requests.post(base_url + command, json=args)
# if resp.status_code != 200:
#     raise Exception('POST {}/{}/ {}'.format(base_url, command, resp.status_code))
# print(resp.json())
# project = resp.json()

## Add custom dataset
# command = "upload_dataset/"
# args = {"project": project, "list": list}
# resp = requests.post(base_url + command, data={"project": json.dumps(project)}, files={'file': open(DATASET_PATH,'rb')})
# if resp.status_code != 200:
#     raise Exception('POST {}/{}/ {}'.format(base_url, command, resp.status_code))
# print(resp.json())
# project = resp

## Import pipeline
# pipeline = None
# command = "pipelines/"
# pipelines = requests.get(base_url + command).json()
# print(len(pipelines), "pipelines downloaded")
# for p in pipelines:
#     if p["id"] == PIPELINE_ID:
#         pipeline = p
#         break
#     
# if pipeline is not None:
#     
#     pipeline["cluster"] = CLUSTER
#     pipeline["username"] = USER
#     pipeline["remote_path"] = REMOTE_PATH
#     
#     if GENOME_TYPE == "modules":
#         pipeline["genome"] = {
#             "type": GENOME_TYPE,
#             "modules": ["profile/bioinf", GENOME]
#         }
#     elif GENOME_TYPE == "path":
#         pipeline["genome"] = {
#             "type": GENOME_TYPE,
#             "path": GENOME
#         }
#     
#     print("Appending pipeline", pipeline["id"], "to the project")
#     if "pipelines" not in project: project["pipelines"] = []
#     project["pipelines"].append(pipeline)

# # Save project
# command = "save_project/"
# resp = requests.post(base_url + command, json=project)
# if resp.status_code != 200:
#     raise Exception('POST {}/{}/ {}'.format(base_url, command, resp.status_code))
# print(resp.json())

# Get templates
command = "templates/"
resp = requests.get(base_url + command)
if resp.status_code != 200:
    raise Exception('POST {}/{}/ {}'.format(base_url, command, resp.status_code))
templates = resp.json()
print(len(templates), " templates loaded.")

# Define launch
if "launches" not in project: project["launches"] = []
launch = copy.deepcopy(templates["launch"])
launch["id"] = "Launch " + str(len(project["launches"]) + 1)
launch["title"] = project["id"]
launch["subtitle"] = project["subtitle"]
launch["description"] = project["description"]
launch["creation_date"] = project["creation_date"] if "creation_date" in project else ""
launch["pipelines"] = copy.deepcopy(project["pipelines"])

if PARTITION:
    launch["partition"] = PARTITION
    launch["tags"] = PARTITION_TAGS
    launch["parallelism"] = PARALLELISM
    
command = "dataset_api/"
resp = requests.post(base_url + command, json=project)
if resp.status_code != 200:
    raise Exception('POST {}/{}/ {}'.format(base_url, command, resp.status_code))
dataset = resp.json()[0]["message"]
print(dataset)
launch["results"] = dataset
project["launches"].append(launch)

# Launch a run
command = "launch_scripts/"
for step in range(1, 6):
    print("STEP", step)
    
    data = launch
    if step >= 3: data = project["runs"][-1]
      
    resp = requests.post(base_url + command + str(step) + "/", json={"project": project, "launch": data})
    if resp.status_code != 200 and resp.status_code != 201:
        raise Exception('POST {}/{}/ {}'.format(base_url, command, resp.status_code))
    
    for m in resp.json():
        if m["type"] != "data":
            print(m)
        else:
            if "runs" not in project: project["runs"] = []
            project["runs"].append(m["message"])

    input("Press any key")










