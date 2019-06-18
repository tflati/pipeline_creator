app.controller('homeController', function($scope, userService, $window, $location, $filter, apiService, moment, messageService, $document, $timeout, $mdDialog, $mdSidenav){
	
	$scope.logged_user = userService;
});