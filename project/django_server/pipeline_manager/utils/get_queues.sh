sacctmgr show Qos format=Name%50,MaxTRES%100 | sed 's/\s\s*/\t/g' | sed 's/^\t//g' | tail -n +3
