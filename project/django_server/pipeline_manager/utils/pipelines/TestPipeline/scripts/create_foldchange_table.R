#!/usr/bin/env Rscript

library("optparse")

###################################
#######  PARSING OPTIONS #########
###################################
option_list = list(
    make_option(c("-p", "--phenodata"), type="character", default=NULL, help="Phenodata file path", metavar="character"),
    make_option(c("-o", "--outdir"), type="character", default="out/", help="Output directory (must exist at launch time) [default= %default]", metavar="character"),
    make_option(c("-i", "--gene_counts"), type="character", default="gene_count_matrix.csv", help="output directory [default= %default]", metavar="character"),
    make_option(c("-v", "--var_to_test"), type="character", help="the variable/column to test against", metavar="character"),
    make_option(c("-n", "--control_name"), type="character", help="the name of controls inside the variable/column to test against", metavar="character"),
    make_option(c("-s", "--subset"), type="character", help="Boolean formula to subset the input data", metavar="character")
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
PATH = opt$outdir
if (is.null(PATH)) PATH = "./"
GENE_COUNTS = opt$gene_counts
VAR_TO_TEST = opt$var_to_test
SUBS = opt$subset
CONTROL_NAME = opt$control_name


# Saving parameters to file
write.table(t(as.data.frame(opt)), file=paste(PATH, "parameters.txt", sep=""))

library("DESeq2")

###################################
#######  DATA IMPORT ##############
###################################
print(paste("Reading gene counts from ", GENE_COUNTS))

countData <- as.matrix(read.csv(GENE_COUNTS, row.names="gene_id"))
colData <- read.csv(PHENO_DATA, sep=",", row.names=1)

#qualche check preliminare. Devo avere due TRUE per poter continuare:
all(rownames(colData) %in% colnames(countData))
#[1] TRUE
countData <- countData[, rownames(colData)]
all(rownames(colData) == colnames(countData))
#[1] TRUE


###################################
#######  DATA SUBSET AND PRE-FILTERING ##############
###################################

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

#Removing genes whose mean expression across samples  is less than 5 FPKM
countData_filt <-  countData_subs[rowMeans(countData_subs)>=5,]

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

###################################
#########  DATA SAVE  ##############
###################################

#####################################################
### Compose the output file's name in a parametric manner. ###
#####################################################
# This string gives a short summary of the tested categories and I parse and use it in the output's name:
tested_cat <- resOrdered@elementMetadata@listData$description[5]
tested_cat <- gsub("Wald test p-value: ", "" , tested_cat)
 
# Exporting NOT filtered results:
write.csv(as.data.frame(resOrdered), file=paste(PATH, paste("gene_expr-", gsub(" ","_",tested_cat), ".csv", sep=""), sep=""))


#############################################
#########  Distance Matrix heatmap  ##############
#############################################
library(ggplot2)

# Figure out how much the replicates look like each other:
library(reshape2)
library(pheatmap)

# Transform count data using the variance stabilizing transform:
deseq2VST <- vst(dds)
library("RColorBrewer")

# Convert the DESeq transformed object to a data frame
deseq2VST <- assay(deseq2VST)
deseq2VST <- as.data.frame(deseq2VST)
deseq2VST$Gene <- rownames(deseq2VST)

# First compare wide vs long version
deseq2VST_wide <- deseq2VST
deseq2VST_long <- melt(deseq2VST, id.vars=c("Gene"))
deseq2VST <- melt(deseq2VST, id.vars=c("Gene"))

# Make a heatmap
vsd <- vst(dds, blind=FALSE)
rld <- rlog(dds, blind=FALSE) #normalizza i valori di count data e li trasforma in log2
# Create distance matrix:
sampleDists <- dist(t(assay(vsd)))
sampleDistMatrix <- as.matrix(sampleDists)
colnames(sampleDistMatrix) <- NULL

# Save distance matrix:
colors <- colorRampPalette( rev(brewer.pal(9, "Blues")) )(255)
heat <- pheatmap(sampleDistMatrix, clustering_distance_rows=sampleDists, clustering_distance_cols=sampleDists, col=colors)
ggsave(file=paste(PATH, "Heatmap_sample_distances.png", sep="."), heat)
