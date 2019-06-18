app.directive('pagination', function($filter) {
  return {
	templateUrl: "templates/pagination.html",
	controller: "paginationController",
	transclude: true,
	link: function($scope, element, attrs, controllers) {
      $scope.list = $scope.$eval(attrs.list);
      $scope.filterText = $scope.$eval(attrs.filter);
      $scope.filterFx = $scope.$eval(attrs.filterFx);
      $scope.sort = $scope.$eval(attrs.sort);
      $scope.reverse = $scope.$eval(attrs.reverse);
      $scope.enableSelection = $scope.$eval(attrs.enableSelection);
      $scope.sortPrefix = attrs.sortPrefix || "";
      $scope.paginationID = attrs.id;
      
//      console.log("PAGINATION LINK", attrs.id, $scope, element, attrs, controllers);
      $scope.update();
  	  
      if(attrs.filter != undefined)
		  $scope.$watch(attrs.filter, function( value ) {
				$scope.filterText = value;
				$scope.begin = 0;
				$scope.update();
		  });
	  
	  if(attrs.sort != undefined)
		  $scope.$watch(attrs.sort, function( value ) {
			  if(value != $scope.sort) console.log("PAGINATION SORT CHANGED", value, $scope.sort);
				$scope.sort = value;
				$scope.begin = 0;
				$scope.update();
		  });
	  
	  if(attrs.reverse != undefined)
		  $scope.$watch(attrs.reverse, function( value ) {
				$scope.reverse = value;
				$scope.begin = 0;
				$scope.update();
		  });
	  
	  if(attrs.list != undefined)
		  $scope.$watchCollection(attrs.list, function( value ) {
			  $scope.update();
		  });
    }
  };
});