app.filter('prepend', function(){
	return function(list, prependString){
		var decorated = [];
		for(i in list)
			decorated.push(prependString + list[i]);
		console.log("PREPEND", list, decorated);
		return decorated;
	};
});