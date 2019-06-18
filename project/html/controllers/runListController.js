app.controller('runListController', function($scope, apiService, messageService){
	
	var self = this;
	
	$scope.removing = new Array($scope.project.runs ? $scope.project.runs.length : 0).fill(false);
	
	$scope.remove_run = function(list, i){
		var run = list[i];
		
		$scope.removing[i] = true;
		apiService.remove_run($scope.project.id, run.id, function(result){
			console.log("[DELETE RUN] AJAX RESULT", result);
			for(var j in result.data)
				messageService.showMessage(result.data[j].message, result.data[j].type);
			
			if(result.data[result.data.length-1].exit_code == 0)
				$scope.delete_from_array(list, i);
			
		}, function(result){
			console.log("[DELETE RUN] AJAX RESULT ERROR", result);
			messageService.showMessage("Server error: " + result.status, "error");
		}, function(){
			console.log("DISABLING LOADING", $scope);
			$scope.removing[i] = false;
		});
	};
});