PORT="7580"
#sudo neo4j-community-3.1.3/bin/neo4j stop
ps x | grep "runserver" | grep $PORT | sed 's/^ //g' | cut -d' ' -f 1 | xargs kill
