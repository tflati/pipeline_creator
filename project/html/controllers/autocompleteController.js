app.controller("autocompleteController", function($scope, $http, $q, $filter, $timeout){
    
	var self = this;
	
//	console.log("AUTOCOMPLETE", $scope);
	
	$scope.querySearch = function(query){
		
		if($scope.url){
//		console.log("AUTOCOMPLETE", query, $scope, $scope.field);
		
//		if ($scope.field.data && $scope.field.data.url){
			var deferred = $q.defer();
			
			 $timeout.cancel($scope.filterTextTimeout);
			// deferred.resolve();

			$scope.filterTextTimeout = $timeout(function() {
	        	
//	        	console.log("AUTOCOMPLETE AJAX [PRE]", $scope.url + query);
	        	
	        	var url = $scope.url
	        	if (query != "") url += query + "/"
	        	
	        	$http.get(url).then(
						function(response) {
							
//							console.log("AUTOCOMPLETE AJAX [RESULT]", query, response);
							
							deferred.resolve(response.data);
						},
						function(response) {
							console.log("[ERROR] COULD NOT GET ANY RESPONSE", response);
						});
	        }, 100);
			
			return deferred.promise;
		}
		else {
//			console.log("AUTOCOMPLETE WITH DATA", $scope.data.length, $scope.data);
			
			return query ? $scope.data : $scope.data.filter(
				function(item)
				{
					return angular.lowercase(item.label).indexOf(angular.lowercase(query)) >= 0;
				});
		}
	};
	
	$scope.selectedItemChange = function(x){
		if(x != undefined){
			console.log("AUTOCOMPLETE SELECTED", x, $scope);
			$scope.onSelect({elem: x, list: $scope.target});
			
			$scope.value = undefined;
		}
	}
});