app.controller("taggerController", function($scope){
    
	var self = this;
	
//	console.log("TAGGER CONTROLLER", $scope);
	
	$scope.transformChip = function(chip){
		if (angular.isObject(chip)) return chip;
  
		if(chip.indexOf("#") != -1){
			var values = chip.split("#");
			return { name: values[0], type: values[1] }
		}
		else return { type: chip }
	};
	
	$scope.searchTags = function(tags, search){
		// console.log("AUTOCOMPLETE TAGS (ALL)", tags);
				
				if(tags == undefined) return [];
				
				tags = tags.filter(function(x){
					if(!search) return true;
					
		// console.log("AUTOCOMPLETE TAGS FILTER", x);
					if(
						(x.name != undefined && x.name.toLowerCase().indexOf(search.toLowerCase()) != -1) ||
						(x.type != undefined && x.type.toLowerCase().indexOf(search.toLowerCase()) != -1)
					)
						return true
						
					return false;
				}).sort(function(x, y){return x.type + "#" + x.name > y.type + "#" + y.name});
		// console.log("AUTOCOMPLETE TAGS", search, tags);
				
				return tags;
			};
});