'use strict';

app.controller('logoutController', function ($scope, userService, apiService, $timeout, $location) {
	  userService.logout($scope.user);
	  
	  $timeout(function(){$location.path("/");}, 3000);
  });
