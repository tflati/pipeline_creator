import openpyxl as opx
import csv
import os
import sys
import shutil

'''
python3 configuration_splitter.py XLS_FILE OUTPUT_DIR [SHEETS_TO_SKIP]
python3 configuration_splitter.py /home/flati/Downloads/rinaldi/ConfigurationsR.xlsx \
        /home/flati/Downloads/rinaldi/matrices/ PRJNA392171,PRJNA341670,Codici
'''

if __name__ == '__main__':
    
    filepath = sys.argv[1]
    output_dir = sys.argv[2]
    skip = []
    if len(sys.argv) > 3:
        skip = sys.argv[3].split(",")
    
    #if os.path.exists(output_dir):
    #    shutil.rmtree(output_dir)
    
    wbook = opx.load_workbook(filepath)
    for wsheet in wbook.worksheets:
        sheet_title = wsheet.title.strip().replace(" ", "_")
        if sheet_title in skip:
            print("Analyzing sheet="+str(wsheet.title) + " -> SKIP")
            continue
        
        print("Analyzing sheet="+str(wsheet.title))
        
        if not os.path.exists(output_dir + "/" + sheet_title):
            os.makedirs(output_dir + "/" + sheet_title)
        
        fd = open(output_dir + "/" + sheet_title + "/phenodata.csv", "w", encoding="utf-8")
        writer = csv.writer(fd)
        row_num = 0
        for row in wsheet.iter_rows():
            
            row_data = []
            for cell in row:
                if cell.value is not None:
                    row_data.append(cell.value)
                    
            if row_num == 0: 
                row_data = [x.strip().replace(" ", ".") for x in row_data]
                
            row_num += 1
            
            writer.writerow(row_data)
        
        fd.close()
        
            
            
