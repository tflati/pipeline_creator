PORT="7580"
#sudo neo4j-community-3.1.3/bin/neo4j start
#nohup python3 -u project/django_server/manage.py runserver $PORT &> run.log &
python3 project/django_server/manage.py runserver $PORT
