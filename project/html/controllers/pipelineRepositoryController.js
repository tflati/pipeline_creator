app.controller('pipelineRepositoryController', function($scope, $state, userService, $state, $window, $location, $filter, apiService, moment, messageService, $document, $timeout, $mdDialog, $mdSidenav){
	$scope.loggedUser = userService;
	
	$scope.state = $state;
	
	$scope.loading = true;
	apiService.get_pipelines(function(resp){
		console.log("PIPELINE REPOSITORY GET", resp);
			$scope.pipelines = resp.data;
	    }, function(error){
	    	messageService.showMessage(error, "warn");
			console.log('Error', error);
	    }, function(){
	    	$scope.loading = false;
	    });
});