sacctmgr show "Account" format=Account%50,GrpTRES | sed 's/^\s*//g' | tail -n +3
