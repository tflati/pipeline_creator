app.controller('conditionController', function($scope){
	
	var self = this;
	
	$scope.over = false;
	
	$scope.condition = undefined;
	
	$scope.onOver = function(){
		console.log("OVER DROPPABLE");
		$scope.over = true;
	};
	
	$scope.onOut = function(){
		console.log("OUT DROPPABLE");
		$scope.over = false;
	};
	
	$scope.onDrop = function(){
		console.log("DROPPED");
	};
});