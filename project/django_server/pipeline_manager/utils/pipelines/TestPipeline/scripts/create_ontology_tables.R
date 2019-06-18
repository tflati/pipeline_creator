#!/usr/bin/env Rscript

library("optparse")

###################################
#######  PARSING OPTIONS #########
###################################

# Real life launch: Rscript create_ontology.R -p phenodata_deseq2.tsv -i gene_count_matrix.csv -v Stress.protocol -o output -n control -m Mus_musculus -d org.Mm.eg.db

option_list = list(
    make_option(c("-p", "--phenodata"), type="character", default=NULL, help="Phenodata file path", metavar="character"),
      make_option(c("-t", "--separator"), type="character", default="\t", help="Separator for phenodata file (e.g., ',' for csv files, '\t' for tsv files, etc.) [default= %default]", metavar="character"),
    make_option(c("-o", "--outdir"), type="character", default="out/", help="Output directory (warning! MUST exist at launch time) [default= %default]", metavar="character"),
    make_option(c("-i", "--gene_counts"), type="character", default="gene_count_matrix.csv", help="output directory [default= %default]", metavar="character"),
    make_option(c("-v", "--var_to_test"), type="character", help="the variable/column to test against", metavar="character"),
    make_option(c("-n", "--control_name"), type="character", help="the name of controls inside the variable/column to test against", metavar="character"),
    make_option(c("-q", "--padjusted"), type="double", default=0.05, help="p-adjusted threshold value [default= %default]", metavar="QVALUE"),
    make_option(c("-f", "--log_fold_change"), type="double", default=1, help="fold-change threshold value [default= %default]", metavar="FOLD_CHANGE_THRESHOLD"),
    make_option(c("-s", "--subset"), type="character", help="Boolean formula to subset the input data", metavar="character"),
    make_option(c("-m", "--model_organism"), type="character", help="the model organism to use during Gene Ontology step, eg Mus_musculus", metavar="character"),
    make_option(c("-d", "--organism_library"), type="character", help="the R DB/library of the model organism to use during Gene Ontology step, e.g. org.Mm.eg.db for Ensembl version of Mus musculus", metavar="character")
);

opt_parser = OptionParser(option_list=option_list);
opt = parse_args(opt_parser);

if (is.null(opt$phenodata))
    stop("Phenodata parameter must be provided (-p). See script usage (--help)")

if (is.null(opt$outdir))
    stop("Output directory parameter must be provided (-o). See script usage (--help)")

if (is.null(opt$var_to_test))
    stop("Variable to test parameter must be provided (-v). See script usage (--help)")

if (is.null(opt$control_name)){
    print("Using lexicographic order of values in column VAR_TO_TEST instead of custom label (e.g., 'control') for differential analysis")
} else {
    print(paste("Using", opt$control_name, "as control value for differential analysis"))
}

    
PHENO_DATA = opt$phenodata
SEPARATOR = opt$separator
PATH = opt$outdir
if (is.null(PATH)) PATH = "./"
GENE_COUNTS = opt$gene_counts
VAR_TO_TEST = opt$var_to_test
SUBS = opt$subset
CONTROL_NAME = opt$control_name
PADJ = opt$padjusted                 #Set the PADJ value cutoff
FC_THR = opt$log_fold_change            #Set the log2FC value cutoff
ORGANISM=opt$model_organism
ORGANISM_LIBRARY = opt$organism_library    # "org.Mm.eg.db"


# Saving parameters to file
write.table(t(as.data.frame(opt)), file=paste(PATH, "parameters.txt", sep=""))

print("Loading DESeq2 package")
library("DESeq2")

###################################
#######  DATA IMPORT ##############
###################################
print(paste("Reading gene counts from ", GENE_COUNTS))

countData <- as.matrix(read.csv(GENE_COUNTS, row.names="gene_id"))
print(paste("Reading phenodata from ", PHENO_DATA))
colData <- read.csv(PHENO_DATA, sep=SEPARATOR, row.names=1)

#qualche check preliminare. Devo avere due TRUE per poter continuare:
print("Do phenodata and gene count matrix refer to the same set of samples?")
all(rownames(colData) %in% colnames(countData))
#[1] TRUE
countData <- countData[, rownames(colData)]
all(rownames(colData) == colnames(countData))
#[1] TRUE


###################################
#######  DATA SUBSET AND PRE-FILTERING ##############
###################################

## Come d'accordo con i ricercatori (Arianna Rinaldi),
## costruisco a monte la stringa per il subset che abbia un aspetto come questa:
## SUBS <- quote(condition=="drought" | condition=="watered")
if (! is.null(SUBS) )
{
#Posso così subsettare phenodata e matrice di conta:
colData_filt <- subset(colData, eval(parse(text = SUBS)))
countData_subs <- countData[,colnames(countData) %in% rownames(colData_filt)]
} else {
colData_filt = colData
countData_subs = countData
}


library(genefilter)

#filtering:
print("####### DATASET PRE-FILTERING ###########")
print("Removing genes whose mean expression is less than 5 FPKM in at least 80% of the samples")
#Define a function to remove genes whose mean expression is less than 5 in at least 80% of the samples:
fun <- kOverA(round(dim(colData_filt)[1]*80/100),5)
#Apply it to my matrix:
filter1 <-  apply( countData_subs, 1, fun)
countData_filt <- countData_subs[filter1,]


##Questo relevel non è sempre fondamentale. Si può saltare se non c'è un vero e proprio campione di controllo (ad. es Pioppo, maiale). E' importante perché il segno del FC dipende da chi si trova al denominatore. Va invece utilizzato ad esempio nel caso dello stress laddove il valore di riferimento DEVE essere "control".
if ( ! is.null(CONTROL_NAME) )
colData_filt[[VAR_TO_TEST]] <- relevel(colData_filt[[VAR_TO_TEST]], ref = CONTROL_NAME)

###################################
#######  DESeq2 ANALYSIS ###########
###################################

# Create a DESeqDataSet from count matrix and labels
# (bisogna ricostruire nuovamente l'oggetto DESeq ogni volta che si cambia il design!)
dds <- DESeqDataSetFromMatrix(countData = countData_filt, colData = colData_filt, design = as.formula(paste("~", VAR_TO_TEST)))

# Run the default analysis for DESeq2 and generate results table
dds <- DESeq(dds)
res <- results(dds)

# Sort and filt  by adjusted p-value:
resOrdered <- res[order(res$padj), ]

# Computing and Exporting only the results which pass an adjusted p value threshold and a particular FC value:
# First of all, we need to subset the matrix:
resSig <- subset(resOrdered, padj < PADJ & abs(log2FoldChange)>=FC_THR)

###################################
#########  DATA SAVE  ##############
###################################

#####################################################
### Compose the output file's name in a parametric manner. ###
#####################################################
# This string gives a short summary of the tested categories and I parse and use it in the output's name:
tested_cat <- resSig@elementMetadata@listData$description[5]
tested_cat <- gsub("Wald test p-value: ", "" , tested_cat)

CONDITION_STRING = paste("qvalue", PADJ, "log2FC", FC_THR, gsub(" ","_",tested_cat), sep=".")






###########################################
###################GENE ONTOLOGY#########
###########################################
library(ORGANISM_LIBRARY, character.only=TRUE) #Genome wide annotation for Mouse, primarily based on mapping using Entrez Gene identifiers.
orgdb <- ORGANISM_LIBRARY
library(clusterProfiler)
library(AnnotationHub)
hub <- AnnotationHub()
query(hub, ORGANISM)

#Gene Ontology for Cellular Components:
CC <- enrichGO(gene = rownames(resSig), OrgDb=orgdb, keyType="SYMBOL", ont ="CC", pAdjustMethod ="fdr", qvalueCutoff = 0.05)
CC_enriched_GO_terms <- data.frame(CC$ID, CC$geneID, CC$p.adjust)
write.csv(CC_enriched_GO_terms, file=paste(paste(PATH,"/", sep=""), "CC_enriched_GO_terms.", CONDITION_STRING, ".csv", sep=""), row.names=F)


#Gene Ontology for Biological processes DEGs are involved in:
BP <- enrichGO(gene = rownames(resSig), OrgDb=orgdb, keyType="SYMBOL", ont ="BP", pAdjustMethod ="fdr", qvalueCutoff = 0.05)
BP_enriched_GO_terms <- data.frame(BP$ID, BP$geneID, BP$p.adjust)
write.csv(BP_enriched_GO_terms, file=paste(paste(PATH,"/", sep=""), "BP_enriched_GO_terms.", CONDITION_STRING, ".csv", sep="") , row.names=F)

#Gene Ontology for Molecular Functions:
MF <- enrichGO(gene =  rownames(resSig), OrgDb=orgdb, keyType="SYMBOL", ont ="MF", pAdjustMethod ="fdr", qvalueCutoff = 0.05)
MF_enriched_GO_terms <- data.frame(MF$ID, MF$geneID, MF$p.adjust)
write.csv(MF_enriched_GO_terms, file=paste(paste(PATH,"/", sep=""), "MF_enriched_GO_terms.", CONDITION_STRING, ".csv", sep="") , row.names=F)


###################################
######### GRAPHICAL PART #########
###################################
if(nrow(CC_enriched_GO_terms)!=0)
{
myplot <- dotplot(BP, font.size= 14)
png(file=paste(PATH, "dotplot_BP_enriched_GO_terms.", CONDITION_STRING, ".png", sep=""), width = 780, height = 480)
print(myplot)
dev.off()
} else {
print("No enriched go terms for Biological Process: no plot produced")
}

if(nrow(MF_enriched_GO_terms)!=0)
{
myplot <- dotplot(MF, font.size= 14)
png(file=paste(PATH, "dotplot_MF_enriched_GO_terms.", CONDITION_STRING, ".png", sep=""),width = 780, height = 480)
print(myplot)
dev.off()
} else {
print("No enriched go terms for Molecular Function: no plot produced")
}

if(nrow(MF_enriched_GO_terms)!=0)
{
myplot <- dotplot(CC, font.size= 14)
png(file=paste(PATH, "dotplot_CC_enriched_GO_terms.", CONDITION_STRING, ".png", sep=""), width = 980, height = 480)
print(myplot) 
dev.off()
} else {
print("No enriched go terms for Molecular Function: no plot produced")
}

 
