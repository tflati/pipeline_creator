app.controller('projectsController', function($scope, userService, $window, $location, $filter, apiService, moment, messageService, $document, $timeout, $mdDialog, $mdSidenav){
	
	$scope.projects = undefined;
	$scope.loggedUser = userService;
	
	$scope.showDeleteProjectDialog = function(project, $event) {
		console.log($scope.projects, project);
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/delete_project_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        return project;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG ANSWER", answer);
	    	
	    	if (answer == "OK") {
	    		apiService.delete_project(project.id, function(result){
	    			console.log("[DELETE PROJECT] AJAX RESULT", result);
	    			messageService.showMessage(result.data.message, result.data.type);
	    			
	    			var i = $scope.projects.indexOf(project);
	    			$scope.delete_from_array($scope.projects, i);
		    		
	    		}, function(result){
	    			console.log("[DELETE PROJECT] AJAX RESULT ERROR", result);
	    			messageService.showMessage("Server error: " + result.status, "error");
	    		});
	    	}
	    }, function() {
	    });
	    
	    $event.stopPropagation();
	};
	
	$scope.showRenameProjectDialog = function(project, $event) {
		console.log($scope.projects, project);
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/rename_project_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        return project;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("RENAME DIALOG ANSWER", answer);
	    	
	    	if (answer != undefined && answer != "Cancel") {
	    		console.log("NEW NAME", answer);
	    		
	    		new_project = angular.copy(project);
	    		new_project.id = answer;
	    		
	    		apiService.save_project(new_project, function(result){
	    			
	    			apiService.delete_project(project, function(result){
	    				messageService.showMessage(result.data.message, result.data.type);
		    			
		    			project.id = answer;
			    		
		    		}, function(result){
		    			console.log("[DELETE OLD - RENAME PROJECT] AJAX RESULT ERROR", result);
		    			messageService.showMessage("Server error: " + result.status, "error");
		    		});
	    			
	    		}, function(result){
	    			console.log("[SAVE NEW - RENAME PROJECT] AJAX RESULT ERROR", result);
	    			messageService.showMessage("Server error: " + result.status, "error");
	    		});
	    	}
	    }, function() {
	    });
	    
	    $event.stopPropagation();
	};
	
	$scope.delete_from_array = function(a, i){
		console.log("[DELETE ELEMENT FROM ARRAY]", a[i], a);
		a.splice(i, 1);
	};
	
	if($scope.loggedUser.loggedIn){
		$scope.loading = true;
		apiService.get_projects(function(result){
			console.log("[GET PROJECTS] AJAX RESULT", result);
			$scope.projects = result.data;
		}, function(error){console.log(error);},
		function(){$scope.loading = false;});
	}
});