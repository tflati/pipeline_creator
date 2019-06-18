'use strict';

app.controller('usersController', function ($scope, apiService, $timeout, $location, $window, $http, messageService) {
	  
	$scope.users = [];
	  
	apiService.users(function(response){
		console.log("USERS", response);
		if(response.data.type == "message")
			messageService.showMessage(response.data.message, response.data.type);
		else
			$scope.users = response.data;
  		},
  		function(response){
  			messageService.showMessage(response.data.message, response.data.type);
			console.log("ERROR", response);
		},
		function(){
		}
	);
	
	$scope.save = function(){
		apiService.save_users($scope.users, function(response){
			console.log("SAVE USERS", response);
			if(response.data.type == "info")
				messageService.showMessage(response.data.message, response.data.type);
	  		},
	  		function(response){
	  			messageService.showMessage(response.data.message, response.data.type);
				console.log("ERROR", response);
			},
			function(){
			}
		);
	}
  });
