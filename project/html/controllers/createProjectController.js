app.controller('createProjectController', function($scope, userService, $state, $window, $location, $filter, apiService, moment, messageService, $document, $timeout, $mdDialog, $mdSidenav){

	$scope.logged_user = userService;
	
	$scope.options = {
		openProjectAutomatically: false
	};
	
	$scope.item = {};
	
	$scope.loading = true;
	apiService.get_templates(function(result){
		console.log("PIPELINER TEMPLATES", result);
		$scope.item = result.data.project;
		$scope.item.creator = $scope.logged_user.username;
	}, function(error){}, function(){$scope.loading = false;});
	
	$scope.uploadTemp = function(files){
		apiService.upload_temp(files, function(resp){
			console.log('Image upload', resp);
			
			$scope.item.img = resp.data[0].message.url;
			messageService.showMessage(resp.data[1].message, resp.data[1].type);
			
		}, function(resp){
			console.log('Image upload error: ', resp);
		});
	};
	
	$scope.createProject = function(){
//		$scope.item.last_modified = $scope.item.creation_date = moment().format();
		
    	console.log("NEW PROJECT", $scope.item);
    	
    	apiService.create_project($scope.item, function(result){
    		messageService.showMessage(result.data.message, result.data.type);
    		
    		console.log("NEW PROJECT RESULT", result, $scope);
    		
    		if(result.data.type != "error")
	    		if ($scope.options.openProjectAutomatically){
	    			console.log("OPENING PROJECT AUTOMATICALLY", $scope.item);
	    			$state.go('project', {project_id: $scope.item.id});
	    		}
	    		else {
	    			console.log("GOING BACK TO PROJECTS", $scope.item);
	    			$state.go("projects");
	    		}
    	});
	};
});