app.controller("autocompleteController", function($scope, $http, $q, $filter, $timeout){
    
	var self = this;
	
	if($scope.cache == undefined) $scope.cache = false;
	
	if($scope.deselectOnClick === undefined)
		$scope.deselectOnClick = true;
	
//	console.log("AUTOCOMPLETE", $scope);
	
	$scope.sending = false;
	
	$scope.querySearch = function(query){
		console.log("AUTOCOMPLETE", "QUERY", query, "URL", $scope.url, "URL CONTEXT", $scope.context, "CACHE", $scope.cache, "SCOPE", $scope, "DATA", $scope.data ? $scope.data.length : "NO DATA");
		
		if(($scope.url || $scope.urlFx) && ($scope.data == undefined || !$scope.cache) && !$scope.sending){
			
			$scope.deferred = $q.defer();
			
//			$scope.filterTextTimeout = $timeout(function() {
	        	
	        	console.log("AUTOCOMPLETE AJAX [PRE]", $scope.url + query);
	        	var url = $scope.url ? $scope.url : $scope.urlFx({context: $scope.context});
//	        	if (query != "") url += query + "/"
	        	console.log("AUTOCOMPLETE URL:", url);
	        	
	        	$scope.sending = true;
	        	$http.get(url).then(
						function(response) {
//							console.log("AUTOCOMPLETE AJAX [RESULT]", query, response);
							
							if($scope.cache && response.data.length > 0)
								$scope.data = response.data;
							
							console.log("AUTOCOMPLETE FINISHED", $scope, "QUERY", query, "SEARCH TEXT", $scope.searchText);
//							return response.data.filter($scope.filter_function(query));
							$scope.deferred.resolve(response.data.filter($scope.filter_function($scope.searchText)));
						},
						function(response) {
							console.log("[ERROR] COULD NOT GET ANY RESPONSE", response);
						}).finally(function(){
							$scope.sending = false;
						});
//	        }, 100);
			
			return $scope.deferred.promise;
		}
		else {
			console.log("AUTOCOMPLETE WITH DATA", $scope.data, $scope.sending, $scope.deferred);
			
			if($scope.sending) return $scope.deferred.promise;
			
			return !query ? $scope.data : $scope.data.filter($scope.filter_function(query));
		}
	};
	
	$scope.filter_function = function(query){
		return function(item)
		{
			return item.label.toLowerCase().indexOf(query.toLowerCase()) >= 0;
		}
	}
	
	$scope.clear_cache = function(){
		$scope.data = undefined;
	}
	
	$scope.selectedItemChange = function(x){
		if(x != undefined){
			console.log("AUTOCOMPLETE SELECTED", x, $scope);
			$scope.onSelect({elem: x, list: $scope.target});
			
			if($scope.deselectOnClick === true){
				$scope.value = undefined;
			}
			
			angular.element(document.querySelector("#pipelinerAutocomplete")).blur();
		}
	}
});