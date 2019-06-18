app.controller('stepRepositoryController', function($scope, userService, $state, $window, $location, $filter, apiService, moment, messageService, $document, $timeout, $mdDialog, $mdSidenav){
	$scope.loggedUser = userService;
	
	$scope.loading = true;
	apiService.get_steps(function(resp){
		console.log("STEP REPOSITORY GET", resp);
			$scope.steps = resp.data;
	    }, function(error){
	    	messageService.showMessage(error, "warn");
			console.log('Error', error);
	    }, function(){
	    	$scope.loading = false;
	    });
});