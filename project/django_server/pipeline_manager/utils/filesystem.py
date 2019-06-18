import fnmatch
import os
import sys
import json
import datetime

def to_human_size(num):

    for unit in ['B','KB','MB','GB','TB','PB']:
        if abs(num) < 1024.0:
            return "%3.1f%s" % (num, unit)
        num /= 1024.0

def load_structure():
    project_info = {}

    with open("dataset", "r") as dataset_reader:
        for line in dataset_reader:
            project_info[line.strip()] = 1
    return project_info
    
    with open("data/projects", "r") as project_reader:
        for bioproject in project_reader:
            bioproject = bioproject.strip()
            bioproject_info = {}
            project_info[bioproject] = bioproject_info
            
            with open("data/"+bioproject + "/experiments", "r") as experiment_reader:
                for experiment in experiment_reader:
                    experiment = experiment.strip()
                    experiment_info = {}
                    bioproject_info[experiment] = experiment_info

                    with open("data/"+bioproject + "/" + experiment + "/samples", "r") as run_reader:
                        for run in run_reader:
                            run = run.strip()
                            experiment_info[run] = 1
    
    return project_info

basedir = ""
if len(sys.argv) > 1:
    basedir = sys.argv[1]
    if basedir[-1] != "/": basedir += "/"

target_dir = 'data/' + basedir

matches = []
filters = []

response = {
    "matches": matches,
    "filters": filters,
    "options": {}
}

if os.path.exists(target_dir):

    sys.stderr.write("Loading structure [{}]\n".format(datetime.datetime.now()))
    info = load_structure()
    sys.stderr.write("Structure loaded [{}]\n".format(datetime.datetime.now()))

    for root, dirnames, filenames in os.walk(target_dir):
        filenames.append(root)
        for filename in filenames:
            if filename != root: path = os.path.join(root, filename)
            else: path = root
            fullpath = os.path.abspath(path)

            type = "file" if os.path.isfile(path) else "dir" if os.path.isdir(path) else "unknown"
            size = os.path.getsize(fullpath)
            human_size = to_human_size(size)
            basename, extension = os.path.splitext(path)
            levels = path.replace("data/", "").split("/")
            bioproject = "none" if len(levels) <= 0 else levels[0] if levels[0] in info else "none"
            # experiment = "none" if len(levels) <= 1 else levels[1] if bioproject in info and levels[1] in info[bioproject] else "none"
            # run = "none" if len(levels) <= 2 else levels[2] if bioproject in info and experiment in info[bioproject] and levels[2] in info[bioproject][experiment] else "none"
            experiment = "none" if len(levels) <= 1 else levels[1] if bioproject in info and levels[1] in info else "none"
            run = "none" if len(levels) <= 2 else levels[2] if bioproject in info and experiment in info and levels[2] in info else "none"
            level = "run" if run is not "none" else "experiment" if experiment is not "none" else "project" if bioproject is not "none" else "top"

            file_info = {
                "selected": True,
                "fullpath": fullpath,
                "path": path,
                "filename": filename,
                "size": size,
                "human_size": human_size,
                "type": type,
                "extension": extension.replace(".", "") if type == "file" and extension is not "" else "unknown",
                "bioproject": bioproject,
                "experiment": experiment,
                "run": run,
                "level": level
            }
            matches.append(file_info)

sys.stderr.write("Creating filters\n")
raw_filters = {}
for match in matches:
    for key, value in match.items():
        if key in ["fullpath", "path", "filename", "size", "human_size", "selected"]: continue
        if key not in raw_filters: raw_filters[key] = {}
        if value not in raw_filters[key]: raw_filters[key][value] = 0
        raw_filters[key][value] += 1
sys.stderr.write("Converting filters\n")
for key,raw_values in raw_filters.items():
    values = []
    for raw_value,count in raw_values.items():
        values.append({"value": raw_value, "count": count, "partial_count": count, "selected": True, "indeterminate": False})
    values.sort(key=lambda x: -x["count"])
    filters.append({"label": key, "values": values, "selected": True, "indeterminate": False})
sys.stderr.write("Filters created\n")

print(json.dumps(response))
