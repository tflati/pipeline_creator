#!/bin/bash

# Description: Downloads the sample
# Short description: Download

# Creation time: 2018-04-10 17:31:59.783577

#SBATCH --job-name=fastq-dump
#SBATCH -N 1
#SBATCH -n 36
#SBATCH -p gll_usr_prod
#SBATCH --mem=115GB
#SBATCH --time 02:00:00
#SBATCH --account cin_staff
#SBATCH --error fastq-dump.err
#SBATCH --output fastq-dump.out


# Module(s) loading

module load profile/bioinf
module load sra/2.8.2


# Command line(s)

fastq-dump --split-files SRR3555183 -O SRR3555183 &
fastq-dump --split-files SRR3555182 -O SRR3555182 &
fastq-dump --split-files SRR3555181 -O SRR3555181 &
fastq-dump --split-files SRR3555178 -O SRR3555178 &
fastq-dump --split-files SRR3555177 -O SRR3555177 &
fastq-dump --split-files SRR3555176 -O SRR3555176 &
fastq-dump --split-files SRR3555172 -O SRR3555172 &
fastq-dump --split-files SRR3555171 -O SRR3555171 &
fastq-dump --split-files SRR3555168 -O SRR3555168 &
fastq-dump --split-files SRR3555167 -O SRR3555167 &
fastq-dump --split-files SRR3555165 -O SRR3555165 &
fastq-dump --split-files SRR3555162 -O SRR3555162 &
fastq-dump --split-files SRR3555161 -O SRR3555161 &
fastq-dump --split-files SRR3555157 -O SRR3555157 &
fastq-dump --split-files SRR3555156 -O SRR3555156 &
fastq-dump --split-files SRR3555155 -O SRR3555155 &
fastq-dump --split-files SRR3555152 -O SRR3555152 &
fastq-dump --split-files SRR3555151 -O SRR3555151 &
fastq-dump --split-files SRR3555148 -O SRR3555148 &
fastq-dump --split-files SRR3555147 -O SRR3555147 &
fastq-dump --split-files SRR3555143 -O SRR3555143 &
fastq-dump --split-files SRR3555142 -O SRR3555142 &
fastq-dump --split-files SRR3555141 -O SRR3555141 &
fastq-dump --split-files SRR3555138 -O SRR3555138 &
fastq-dump --split-files SRR3555137 -O SRR3555137 &
fastq-dump --split-files SRR3555134 -O SRR3555134 &
fastq-dump --split-files SRR3555133 -O SRR3555133 &
fastq-dump --split-files SRR3555129 -O SRR3555129 &
fastq-dump --split-files SRR3555128 -O SRR3555128 &
fastq-dump --split-files SRR3555124 -O SRR3555124 &
fastq-dump --split-files SRR3555123 -O SRR3555123 &
fastq-dump --split-files SRR3555119 -O SRR3555119 &
fastq-dump --split-files SRR3555115 -O SRR3555115 &
fastq-dump --split-files SRR3555114 -O SRR3555114 &
fastq-dump --split-files SRR3555113 -O SRR3555113 &
fastq-dump --split-files SRR3555109 -O SRR3555109 &
fastq-dump --split-files SRR3555108 -O SRR3555108 &
fastq-dump --split-files SRR3555105 -O SRR3555105 &
fastq-dump --split-files SRR3555104 -O SRR3555104 &
fastq-dump --split-files SRR3555103 -O SRR3555103 &
fastq-dump --split-files SRR3555099 -O SRR3555099 &
fastq-dump --split-files SRR3555098 -O SRR3555098 &
fastq-dump --split-files SRR3555094 -O SRR3555094 &
fastq-dump --split-files SRR3555093 -O SRR3555093 &
fastq-dump --split-files SRR3555089 -O SRR3555089 &
fastq-dump --split-files SRR3555088 -O SRR3555088 &
fastq-dump --split-files SRR3555087 -O SRR3555087 &
wait