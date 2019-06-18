import json
import argparse
import sys
import os
from collections import Counter

def load_results(files):
    results = []
    for file in files:
        with open(file) as f:
            result = json.load(f)
            results.append(result)
    
    return results

def output_results(results):
#     with open(output_file, 'w') as f:
#         json.dump(results, f)
    print(json.dumps(results, indent=4))

def create(step_id, entity_id, file, type="tsv"):
    
    status = "OK"
    data = []
    header = []

    if not os.path.exists(file):
        status = "NOT_EXISTS"
    else:
        with open(file, "r") as f:
            for line in f:
                line = line.strip()
                fields = None
                if type == "tsv": fields = line.split("\t")
                if type == "csv": fields = line.split(",")
                if type == "key-value": fields = line.split("=")
                
                fields = [x.strip() for x in fields]
                
                if line.startswith("#"):
                    fields[0] = fields[0].replace("#", "")
                    header = fields
                    continue
                
                if type == "tsv" or type == "csv":
                    
                    d = {}
                    for (k,f) in zip(header, fields):
                        if f == "":
                            status = "PARTIAL"
                            continue
                        
                        d[k] = f
                        
                    data.append(d)
                    
                elif type == "key-value":
                    if fields[1] == "":
                        status = "PARTIAL"
                        continue
                
                    if len(data) == 0: data.append({})
                    data[0][fields[0]] = fields[1]
    
    return {"step_id": step_id, "id": entity_id, "path": file, "absolute_path": os.path.abspath(file), "status": status, "data": data}

def aggregate(id, file_list):
    
    files = []
    with open(file_list) as reader:
        for line in reader:
            files.append(line.strip())
    
    results = load_results(files)
    
    response = {
        "id": id,
        "total": len(results),
        "status": Counter(),
        "data": [],
#         "counters": {}
    }
    
    for result in results:
        response["data"].append(result)
        response["status"][result["status"]] += 1
        
#         for datum in result["data"]:
#             for key,value in datum.items():
#                 if key not in response["counters"]: response["counters"][key] = Counter()
#                 response["counters"][key][result["id"]] = value
            
    return response

# def create_table(results, header):
#     total = len(results)
#     
#     rows = []
#     for result in results:
#         row = {}
#         for h in header:
#             label = h[label]
#             results[label] = result[label]
#         rows.append(row)
#     
#     table = {
#         "header": header,
#         "rows": rows,
#         "total": total
#     }
#     
#     return table
# 
# def create_graph(results, type, axis, options):
#     graph = {
#         "type": type,
#         "axis": axis,
#         "options": options,
#         "data": results
#     }
#     
#     return graph


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Pipeline monitor result formatter')
    parser.add_argument('-m','--mode', required=True, help='Analysis modality')
    parser.add_argument('-i','--id', required=True, help='Step or entity ID')
    parser.add_argument('-s','--step-id', required=True, help='Step id')
    parser.add_argument('-f','--file', required=False, help='Files')
    parser.add_argument('-l','--file_list', required=False, help='Files')
    parser.add_argument('-t','--type', required=False, help='File type')

    args = parser.parse_args()
    mode = args.mode
    entity_id = args.id
    file = args.file
    file_list = args.file_list
    format = args.type
    step_id = args.step_id
    
    sys.stderr.write(str(args) + "\n")
    
    if mode == "single":
        results = create(step_id, entity_id, file, format)
    elif mode == "multi":
        results = aggregate(entity_id, file_list)
        
    output_results(results)
    