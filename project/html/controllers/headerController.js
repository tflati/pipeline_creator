app.controller('headerController', function($scope, userService, $state, $window, $location, $filter, apiService, moment, messageService, $document, $timeout, $mdDialog, $mdSidenav){

	$scope.logged_user = userService;
	$scope.state = $state;
	
	$scope.show_how_to = function(){
		var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/how_to_dialog.html',
			parent: angular.element(document.body),
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		    	  return "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC/vggD6IJLoy1l2foO9crvrlN0u0hKnZnRmfpQzzv0VO1qv9c6wXsacrOCuJZpphf9OResmKWD4tZnyv+tysla0gqtyqJCCRitkZ4JbzXodptbdnojnzD72O8ikIsUS4rLSG2+R63NfZLH8ygbQ75e0iKuMRN6UBxSYMw85kGZrky1d7gWnqbLHYgM5GT1vrV0ymouNfkTrW7Xs5a8u3K13PaZ9ZOg9nksvO2g9dilkUZeRK8n1cNcQoCudofVjdbf/AxDdJxvlNdcnFoYbSRCXRo86CrPGC14DEXdjfGuzMc6+Zz79FnafCr41vxRUlbybHzWGDZZZd7JExP28A35 flati@DTFLATI00220575";
		      }
		    }
	    };

	    $mdDialog.show(confirm);
	};
});