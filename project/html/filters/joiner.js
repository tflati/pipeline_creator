app.filter('joiner', function(){
	return function(list, delimiter){
		if (list.length == 0) return "None";
		return (list || []).join(delimiter || ', ');
	};
});