app.filter('notEmpty', function(){
	return function(list){
		return list.filter(function(item) {
		  return item != "" && item != null;
		});
	};
});