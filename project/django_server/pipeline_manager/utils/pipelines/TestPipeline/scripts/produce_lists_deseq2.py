from optparse import OptionParser
import os
from subprocess import Popen
import sys
import math

def create_fold_change_table(gene_count_file, outputdir, phenodata_file, covariate, subset=None, control_name=None):
    command_args = ["-i", gene_count_file, "-o", outputdir, "-p", phenodata_file, "-t", ",", "-v", covariate]
    if control_name is not None: command_args += ["-n", control_name]
    if subset is not None: command_args += ["-s", subset]
    
    print("Invoking create_foldchange_table.R")
    proc = Popen(["Rscript", "create_foldchange_table.R"] + command_args)
    proc.wait()
    print("Return code = {}".format(proc.returncode))
    if proc.returncode != 0: print("[STATUS] ERROR ", command_args)
    else: print("[STATUS] OK ", command_args)

def create_degs(gene_count_file, outputdir, phenodata_file, covariate, control_name=None, subset=None, logfoldchange=1, qvalue=0.05):
    
    command_args = ["-i", gene_count_file, "-o", outputdir, "-p", phenodata_file, "-t", ",", "-v", covariate, "-f", logfoldchange, "-q", qvalue]
    if control_name is not None: command_args += ["-n", control_name]
    if subset is not None: command_args += ["-s", subset]

    print("Invoking produce_DEG_table.R")
    proc = Popen(["Rscript", "produce_DEG_table.R"] + command_args)
    proc.wait()
    print("Return code = {}".format(proc.returncode))
    if proc.returncode != 0: print("[STATUS] ERROR ", command_args)
    else: print("[STATUS] OK ", command_args)

def create_ontology(gene_count_file, outputdir, phenodata_file, covariate, control_name=None, subset=None, organism_model=None, organism_db=None, logfoldchange=1, qvalue=0.05):
    command_args = ["-i", gene_count_file, "-o", outputdir, "-p", phenodata_file, "-t", ",", "-v", covariate, "-f", logfoldchange, "-q", qvalue]
    if control_name is not None: command_args += ["-n", control_name]
    if subset is not None: command_args += ["-s", subset]
    if organism_model is not None and organism_db is not None: command_args += ["-m", organism_model, "-d", organism_db]

    print("Invoking create_ontology_tables.R")
    proc = Popen(["Rscript", "create_ontology_tables.R"] + command_args)
    proc.wait()
    print("Return code = {}".format(proc.returncode))
    if proc.returncode != 0: print("[STATUS] ERROR ", command_args)
    else: print("[STATUS] OK ", command_args)
    
def create_degs_for_subset_file(combination_file, indir, outdir, control_name, organism_model, organism_db):
    
    if not outdir.endswith("/"): outdir += "/"
    
    with open(combination_file, "r") as reader:
        for line in reader:
            if len(line) == 0: break
            if line.startswith("#"): continue
          
            pieces = line.split("\t")
            
            ID = pieces[0]
            bioproject = pieces[1]
            subset = pieces[2]
            covariate = pieces[3]
          
    #       if ID != "PRJNA401858_0": continue
          
            print("#########")
            print(bioproject)
            print(subset)
            print(covariate)
            print(ID)
            
            print("Processing configuration {}".format(ID))
            if not os.path.exists(indir + bioproject):
                print("MISSING DATA", indir + bioproject)
                continue
            
            #Load gene(/transcript) count matrix and labels
            gene_count_file = indir + bioproject + "/" + "gene_count_matrix.csv"
            phenodata_file = indir + bioproject + "/" + "phenodata.csv"
            
            outputdir = outdir + ID + "/"
            if not os.path.exists(outputdir):
                os.makedirs(outputdir)
#                 create_fold_change_table(gene_count_file, outputdir, phenodata_file, covariate, subset, control_name)
            
            couples = zip(["{:.2f}".format(math.log(x * 0.1, 2)) for x in range(10, 21, 1)], ["0.05"]*11)
            for couple in couples:
                 
                fulloutputdir = outdir + ID + "/lfc" + couple[0] + "-q" + couple[1] + "/"
                if not os.path.exists(fulloutputdir):
                    os.makedirs(fulloutputdir)
#                 else:
#                     print("SKIPPING", fulloutputdir)
#                     continue
                 
                print("Analyzing " + str(couple) + " for subset " + subset)
#                 create_degs(gene_count_file, fulloutputdir, phenodata_file, covariate, control_name, subset, couple[0], couple[1])
                create_ontology(gene_count_file, fulloutputdir, phenodata_file, covariate, control_name, subset, organism_model, organism_db, couple[0], couple[1])
            
            
#             raw_input("Press any key to analyze next subset...")
            
            print("Differential data for configuration {} produced.".format(ID))

# Real-world invocation command line:
#
# python produce_lists_deseq2.py -n "control" -f data/configurations.tsv -i data/ -o output_final_4/ -m "Mus musculus" -d "org.Mm.eg.db"

if __name__ == '__main__':

    opt_parser = OptionParser()
    
    opt_parser.add_option("-f", "--combination_file", default=None, help="File name containing the combinations")
    opt_parser.add_option("-i", "--indir", help="Input directory name with data for all bioprojects [default= %default]")
    opt_parser.add_option("-o", "--outdir", default="out/", help="Output directory name [default= %default]")
    opt_parser.add_option("-n", "--control_name", help="Label for control condition")
    opt_parser.add_option("-m", "--organism", help="Organism name")
    opt_parser.add_option("-d", "--organism_db", help="Organism DB")
    
    (opt, args) = opt_parser.parse_args()
    
    if not opt.combination_file:
        opt_parser.print_help()
        exit("Please provide a configuration input file. [--combination_file]")
      
    if not opt.indir:
        opt_parser.print_help()
        exit("Please provide an input directory with the input data. [--indir]")
    
    create_degs_for_subset_file(opt.combination_file, opt.indir, opt.outdir, opt.control_name, opt.organism, opt.organism_db)
