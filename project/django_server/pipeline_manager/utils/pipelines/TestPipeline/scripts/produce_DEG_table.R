#!/usr/bin/env Rscript

library("optparse")

###################################
#######  PARSING OPTIONS #########
###################################
option_list = list(
    make_option(c("-p", "--phenodata"), type="character", default=NULL, help="Phenodata file path", metavar="character"),
	make_option(c("-t", "--separator"), type="character", default="\t", help="Separator for phenodata file (e.g., ',' for csv files, '\t' for tsv files, etc.) [default= %default]", metavar="character"),
    make_option(c("-o", "--outdir"), type="character", default="out/", help="Output directory (must exist at launch time) [default= %default]", metavar="character"),
    make_option(c("-i", "--gene_counts"), type="character", default="gene_count_matrix.csv", help="output directory [default= %default]", metavar="character"),
    make_option(c("-v", "--var_to_test"), type="character", help="the variable/column to test against", metavar="character"),
    make_option(c("-n", "--control_name"), type="character", help="the name of controls inside the variable/column to test against", metavar="character"),
    make_option(c("-q", "--padjusted"), type="double", default=0.05, help="p-adjusted threshold value [default= %default]", metavar="QVALUE"),
    make_option(c("-f", "--log_fold_change"), type="double", default=1, help="fold-change threshold value [default= %default]", metavar="FOLD_CHANGE_THRESHOLD"),
    make_option(c("-s", "--subset"), type="character", help="Boolean formula to subset the input data (e.g., Treatment.2='ELS-late_postnatal')", metavar="character")
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

# Saving parameters to file
write.table(t(as.data.frame(opt)), file=paste(PATH, "parameters.txt", sep=""))

library("DESeq2")

###################################
#######  DATA IMPORT ##############
###################################
print("#######  DATA IMPORT ##############")
print(paste("Reading gene counts from ", GENE_COUNTS))
countData <- as.matrix(read.csv(GENE_COUNTS, row.names="gene_id"))

print(paste("Reading phenodata form ", PHENO_DATA))
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
print("#######  DESeq2 ANALYSIS ###########")
dds <- DESeqDataSetFromMatrix(countData = countData_filt, colData = colData_filt, design = as.formula(paste("~", VAR_TO_TEST)))

# Run the default analysis for DESeq2 and generate results table
dds <- DESeq(dds)
res <- results(dds)
#add an extra column to mark outliers:
res$outlier = res$baseMean > 0 & is.na(res$pvalue)

# Computing and Exporting only the results which pass an adjusted p value threshold and a particular FC value:
# First of all, we need to subset the matrix:
print("Subsetting dataset")
resSig <- subset(res, padj < PADJ & abs(log2FoldChange)>=FC_THR)
#sort and show by FC value:
resSig <- resSig[order(abs(resSig$log2FoldChange),decreasing=T), ]

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

# Exporting filtered results:
write.csv(as.data.frame(resSig), file=paste(PATH, "DEGs-", CONDITION_STRING, ".csv", sep=""))

print("Written table of DEGs")

##HTML Report creation:
library("ReportingTools")
htmlRep <- HTMLReport(shortName="report", title="My report", reportDirectory="html", basePath=PATH)
publish(as.data.frame(resSig), htmlRep)
url <- finish(htmlRep)


###################################
######### GRAPHICAL PART #########
###################################

print("######### GRAPHICAL PART #########")

#plotto in un unico grafico le conte di espressione nei DEGs (ne riporto fino a 10) divisi per VAR_TO_TEST:
print(paste("I'm plotting the counts for the genes in the toptable of DEGs, dividing sample groups by ", VAR_TO_TEST))
if(nrow(resSig)!=0 & nrow(resSig)<=10)
{
loop.vector<-rownames(resSig)
print(loop.vector)
print(paste(PATH, "toptable_DEGs-plot_counts_by_", VAR_TO_TEST , ".png", sep=""))
png(file=paste(PATH, "toptable_DEGs-plot_counts_by_", VAR_TO_TEST , ".png", sep=""), res=100)
par(mfrow = c(2, 5))
plotcounts <- for (i in loop.vector) {plotCounts(dds,i, intgroup = VAR_TO_TEST)}
dev.off()
} else {
loop.vector<-rownames(resSig)[c(1:10)]
png(file=paste(PATH, "toptable_DEGs-plot_counts_by_", VAR_TO_TEST , ".png", sep=""), res=100)
par(mfrow = c(2, 5))
plotcounts <- for (i in loop.vector) {plotCounts(dds,i, intgroup = VAR_TO_TEST)}
dev.off()
}


print("loading ggplot2 package")
library(ggplot2)

# Vulcano plot on DEGs samples:
toptable <- as.data.frame(res)

EnhancedVolcanoDESeq2 <- function(toptable, AdjustedCutoff=PADJ, LabellingCutoff=PADJ, FCCutoff=FC_THR, main="VolcanoPlot")
{
  toptable$Significance <- "NS"
  toptable$Significance[(abs(toptable$log2FoldChange) > FCCutoff)] <- "FC"
  toptable$Significance[(toptable$padj<AdjustedCutoff)] <- "FDR"
  toptable$Significance[(toptable$padj<AdjustedCutoff) & (abs(toptable$log2FoldChange)>FCCutoff)] <- "FC_FDR"
  table(toptable$Significance)
  toptable$Significance <- factor(toptable$Significance, levels=c("NS", "FC", "FDR", "FC_FDR"))

  plot <- ggplot(toptable, aes(x=log2FoldChange, y=-log10(padj))) +
    #scale_y_continuous(breaks = seq(0, 150, by = 25)) +
    #axis.break(axis=1,breakpos=100,pos=NA,bgcol="white",breakcol="black", style="slash",brw=0.02)
    
    #Add points:
    #   Colour based on factors set a few lines up
    #   'alpha' provides gradual shading of colour
    #   Set size of points
    geom_point(aes(color=factor(Significance)), alpha=1/2, size=0.8) +

    #Choose which colours to use; otherwise, ggplot2 chooses automatically (order depends on how factors are ordered in toptable$Significance)
    scale_color_manual(values=c(NS="grey30", FC="forestgreen", FDR="royalblue", FC_FDR="red2"), labels=c(NS="NS", FC=paste("LogFC>|", FCCutoff, "|", sep=""), FDR=paste("FDR Q<", AdjustedCutoff, sep=""), FC_FDR=paste("FDR Q<", AdjustedCutoff, " & LogFC>|", FCCutoff, "|", sep=""))) +

    #Set the size of the plotting window
    theme_bw(base_size=24) +

    #Modify various aspects of the plot text and legend
    theme(legend.background=element_rect(),
          plot.title=element_text(angle=0, size=12, face="bold", vjust=1),

          panel.grid.major=element_blank(), #Remove gridlines
          panel.grid.minor=element_blank(), #Remove gridlines

          axis.text.x=element_text(angle=0, size=12, vjust=1),
          axis.text.y=element_text(angle=0, size=12, vjust=1),
          axis.title=element_text(size=12),

          #Legend
          legend.position="top",            #Moves the legend to the top of the plot
          legend.key=element_blank(),       #removes the border
          legend.key.size=unit(0.5, "cm"),  #Sets overall area/size of the legend
          legend.text=element_text(size=8), #Text size
          title=element_text(size=8),       #Title text size
          legend.title=element_blank()) +       #Remove the title

    #Change the size of the icons/symbols in the legend
    guides(colour = guide_legend(override.aes=list(size=2.5))) +

    #Set x- and y-axes labels
    xlab(bquote(~Log[2]~ "fold change")) +
    ylab(bquote(~-Log[10]~adjusted~italic(P))) +

    #Set the axis limits
    #xlim(-6.5, 6.5) +
    #ylim(0, 100) +

    #Set title
    ggtitle(main) +

    #Tidy the text labels for a subset of genes
    geom_text(data=subset(toptable, padj<LabellingCutoff & abs(log2FoldChange)>FCCutoff),
              aes(label=rownames(subset(toptable, padj<LabellingCutoff & abs(log2FoldChange)>FCCutoff))),
              size=2.25,
              #segment.color="black", #This and the next parameter spread out the labels and join them to their points by a line
              #segment.size=0.01,
              check_overlap=TRUE,
              vjust=1.0) +

    #Add a vertical line for fold change cut-offs
    geom_vline(xintercept=c(-FCCutoff, FCCutoff), linetype="longdash", colour="black", size=0.4) +

    #Add a horizontal line for P-value cut-off
    geom_hline(yintercept=-log10(AdjustedCutoff), linetype="longdash", colour="black", size=0.4)

  return(plot)
}

# Create and save the volcano plot (if the matrix contains rows):
if(nrow(toptable)!=0)
{
print("Table of DEGs contains results: I'm plotting a volcano plot")
volc <- EnhancedVolcanoDESeq2(toptable, AdjustedCutoff=PADJ, LabellingCutoff=PADJ, FCCutoff=FC_THR, main=paste("Volcano Plot of differentially expressed genes", gsub(" ","_",tested_cat), sep="\n"))
ggsave(file=paste(PATH, "DEGs_volcanoplot-", CONDITION_STRING, ".png", sep=""), volc)
} else {
print("Table of DEGs does not contain any results: No volcano plot produced")
}

#############################################
#########  Heatmap with DEG  ##################
#############################################

# DEG heatmap:
print("Loading R packages for heatmap")
print("Producing a heatmap with DEGs")
library(pheatmap)
library(gplots)
deseq2VST <- vst(dds)
deseq2VST <- assay(deseq2VST)   
colnames(deseq2VST) <- colData_filt[[VAR_TO_TEST]]

# Extract the rows you want by indexing, you just need to create a vector of the genes you want to pull out. For example:
idx <- rownames(res)[ which(res$padj < PADJ & abs(res$log2FoldChange)>=FC_THR) ]

if(nrow(deseq2VST[ idx, ])!=0)
{
print(paste("the number of rows for the heatmap input matrix is ",nrow(deseq2VST[ idx, ])))
print("Producing a heatmap on DEGs")
deg_heat <- pheatmap(deseq2VST[ idx, ],scale = "row", clustering_distance_rows = "correlation", clustering_method = "complete")
png(file=paste(PATH, "DEGs_heatmap-", CONDITION_STRING, ".png", sep=""))
print(deg_heat)
dev.off()
} else {
print(paste("the number of rows for the heatmap input matrix is ",nrow(deseq2VST[ idx, ])))
print("table of DEGs is empty or it is not a dataframe: no heatmap will be produced")
}



#############################################
############ Matrix MAplot  ###################
#############################################

# MAplot:
#plotMA(res, cex=0.8, alpha=PADJ)
#ggsave(file=paste(PATH, "DEGs_MAplot-", CONDITION_STRING, ".png", sep=""))
