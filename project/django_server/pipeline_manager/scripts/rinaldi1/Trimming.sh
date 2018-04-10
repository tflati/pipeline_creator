#!/bin/bash

# Description: dqadioaoidh aodh ad ai jdoia d
# Short description: Trimmomatic

# Creation time: 2018-04-10 17:31:59.783750

#SBATCH --job-name=
#SBATCH -N 1
#SBATCH -n 36
#SBATCH -p gll_usr_prod
#SBATCH --mem=115GB
#SBATCH --time 02:00:00
#SBATCH --account cin_staff
#SBATCH --error 
#SBATCH --output 


# Module(s) loading

module load profile/bioinf
module load cuda/9.0
module load samtools/1.7
module load python/2.7.12


# Command line(s)

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555183/SRR3555183_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555183/SRR3555183_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555182/SRR3555182_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555182/SRR3555182_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555181/SRR3555181_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555181/SRR3555181_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555178/SRR3555178_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555178/SRR3555178_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555177/SRR3555177_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555177/SRR3555177_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555176/SRR3555176_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555176/SRR3555176_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555172/SRR3555172_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555172/SRR3555172_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555171/SRR3555171_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555171/SRR3555171_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555168/SRR3555168_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555168/SRR3555168_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555167/SRR3555167_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555167/SRR3555167_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555165/SRR3555165_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555165/SRR3555165_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555162/SRR3555162_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555162/SRR3555162_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555161/SRR3555161_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555161/SRR3555161_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555157/SRR3555157_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555157/SRR3555157_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555156/SRR3555156_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555156/SRR3555156_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555155/SRR3555155_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555155/SRR3555155_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555152/SRR3555152_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555152/SRR3555152_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555151/SRR3555151_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555151/SRR3555151_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555148/SRR3555148_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555148/SRR3555148_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555147/SRR3555147_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555147/SRR3555147_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555143/SRR3555143_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555143/SRR3555143_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555142/SRR3555142_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555142/SRR3555142_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555141/SRR3555141_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555141/SRR3555141_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555138/SRR3555138_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555138/SRR3555138_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555137/SRR3555137_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555137/SRR3555137_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555134/SRR3555134_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555134/SRR3555134_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555133/SRR3555133_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555133/SRR3555133_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555129/SRR3555129_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555129/SRR3555129_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555128/SRR3555128_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555128/SRR3555128_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555124/SRR3555124_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555124/SRR3555124_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555123/SRR3555123_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555123/SRR3555123_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555119/SRR3555119_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555119/SRR3555119_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555115/SRR3555115_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555115/SRR3555115_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555114/SRR3555114_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555114/SRR3555114_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555113/SRR3555113_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555113/SRR3555113_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555109/SRR3555109_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555109/SRR3555109_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555108/SRR3555108_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555108/SRR3555108_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555105/SRR3555105_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555105/SRR3555105_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555104/SRR3555104_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555104/SRR3555104_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555103/SRR3555103_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555103/SRR3555103_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555099/SRR3555099_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555099/SRR3555099_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555098/SRR3555098_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555098/SRR3555098_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555094/SRR3555094_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555094/SRR3555094_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555093/SRR3555093_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555093/SRR3555093_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555089/SRR3555089_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555089/SRR3555089_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555088/SRR3555088_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555088/SRR3555088_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555087/SRR3555087_1.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18

java -Xmx2g -classpath /usr/local/bin/trimmomatic/trimmomatic.jar org.usadellab.trimmomatic.TrimmomaticSE -phred33 $BASEDIR/SRR3555087/SRR3555087_2.fastq ILLUMINACLIP:/Volumes/Storage_1/Sequencing_1/References/Contaminants/contaminants.fasta:2:40:12 LEADING:10 TRAILING:10 SLIDINGWINDOW:4:18 MINLEN:18 &
wait