'use strict';

app.controller('loginController', function ($scope, apiService, $http, $window, toaster, userService, $location, $timeout) {
	  
	  $scope.userService = userService;
	  $scope.loggedUser = userService;
	  
	  $scope.user = {
			  email: '',
			  password: ''
	  };
	  
	  $scope.send = function(){
		  
		  apiService.login($scope.user,
				  function(response){
					console.log(response, response.header);
					userService.login();
					
					$window.scrollTo(0, 0);
					$timeout(function(){$location.path("/");}, 3000);
		  		}, function(response){
					toaster.pop({
				            type: response.data.type,
				            title: "Server error",
				            body: response.data.message,
				            timeout: 3000
				        });
					console.log("ERROR", response);
				}, function(){
				});
	  };
  });
