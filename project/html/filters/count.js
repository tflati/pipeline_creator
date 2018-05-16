app.filter('count', function(){
	return function(list){
		return (list || []).length;
	};
});