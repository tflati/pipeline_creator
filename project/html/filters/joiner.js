app.filter('joiner', function(){
	return function(list, delimiter){
		return (list || []).join(delimiter || ', ');
	};
});