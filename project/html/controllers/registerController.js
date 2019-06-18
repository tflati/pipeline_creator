'use strict';

app.controller('registerController', function ($scope, apiService, $timeout, $location, $window, $http, toaster) {
	  
	  $scope.user = {};
	  
	  $scope.send = function(){
		  
		  apiService.register($scope.user,
				  function(response){
					console.log(response);
					
					if(response.data.type == "message"){
						$scope.registration_successful = true;
						$window.scrollTo(0, 0);
						$timeout(function(){$location.path("/");}, 3000);
					}
					
					toaster.pop({
			            type: response.data.type,
			            title: "Server " + response.data.type,
			            body: response.data.message,
			            timeout: 3000
			        });
	  		},
	  		function(response){
	  			toaster.pop({
		            type: response.data.type,
		            title: "Server " + response.data.type,
		            body: response.data.message,
		            timeout: 3000
		        });
				console.log("ERROR", response);
			},
			function(){
			});
	  };
  });
