#	--exclude="index.html" \
#	--exclude="apiService.js" \

rsync -var $1 \
	--exclude="apiService.js" \
	--exclude="index.html" \
	--exclude="launches" \
	--exclude="run.log" \
	--exclude=".git" \
	--exclude="db.sqlite3" \
	--exclude="bower_components" \
	--exclude="temp" \
	--exclude="data" \
	--exclude="migrations" \
	--exclude="pipelines" \
	--exclude="*pyc" \
	. vm:/mnt/disk2/Pipeliner/
