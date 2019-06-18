#!/bin/bash

sacct -P --delimiter="	" --starttime "`cat run_info`" --format="JobID,ExitCode,User,Time,Elapsed,State,JobName%200,End" | grep -v "batch" | grep -v "extern" > tmp1
cat tmp1 | head -n 1 | tr '\n' '\t' > header1

cat tmp1 | cut -f 1 > id_sacct

squeue -u $(whoami) -O "JobID,Exit_Code,Username,Timelimit,Timeused,State,Name:200,Endtime" | sed 's/\s\s*/\t/g' | sed 's/\t*$//g' | grep "PENDING" | grep -v -f id_sacct > tmp2

cat tmp1 tmp2 > tmp

cat tmp | grep -f job_ids | sort > body
echo -e "NodeName\tPipelineID\tBioentityID\tBioentityType\tStepTitle\tScriptPath\tStandardOutput\tStandardError" > header2


# Filter out the jobs which do not belong to this project
join -j 1 -t '	' body job_info > prefinal
cat header1 header2 > header
cat header prefinal
rm tmp1 tmp2 tmp id_sacct header1 header2 header body prefinal