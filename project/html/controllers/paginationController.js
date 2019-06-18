app.controller("paginationController", function($scope, $filter){
    
	var self = this;
	
	if($scope.numElementsPerPage == undefined) $scope.numElementsPerPage = 10;
	if($scope.begin == undefined) $scope.begin = 0;
	$scope.options = {};
//	console.log("PAGINATION CONTROLLER", $scope.paginationID, $scope, $scope.begin, $scope.numElementsPerPage, $scope.list);
	
    $scope.paginationNext = function(){
//    	console.log("PAGINATION NEXT", $scope.paginationID, $scope, $scope.begin, $scope.numElementsPerPage, $scope.list);
    	$scope.begin = Math.min($scope.begin+$scope.numElementsPerPage, $scope.filtered.length)
		$scope.update();
    };
    
    $scope.paginationPrevious = function(){
//    	console.log("PAGINATION NEXT", $scope.paginationID, $scope.begin);
    	$scope.begin = Math.max(0, $scope.begin - $scope.numElementsPerPage);
   		$scope.update();
    };
    
    $scope.paginationFirst = function(){
    	$scope.begin = 0;
    	$scope.update();
    };
    
    $scope.paginationLast = function(){
    	$scope.begin = $scope.filtered.length - $scope.numElementsPerPage;
    	$scope.update();
    };
    
    $scope.applyFilter = function(){
    	var f = $scope.list;
    	
    	if($scope.filterText != undefined)
    		f = $filter('filter')(f, $scope.filterText);
    	
    	if($scope.filterFx)
    		f = $scope.filterFx(f);

    	if($scope.options.showOnlySelected)
    		f = $filter('filter')(f, {selected: true});
    	
    	$scope.filtered = f;
    };
    
    $scope.update = function(){
    	$scope.applyFilter();
    	
    	if($scope.sort != undefined)
    		$scope.filtered = $filter('orderBy')($scope.filtered, $scope.sortPrefix + $scope.sort, !$scope.reverse);
    	
    	var end = Math.min($scope.begin + $scope.numElementsPerPage, $scope.filtered.length);
    	$scope.displayed = $scope.filtered.slice($scope.begin, end);
    	
//    	console.log("UPDATE PAGINATION", $scope.paginationID, $scope.sort, $scope.reverse, $scope, $scope.list, $scope.filtered, $scope.displayed, $scope.begin, end, $scope.numElementsPerPage);
    };
});