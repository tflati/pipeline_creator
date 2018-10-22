function DialogController($scope, $mdDialog, messageService, item) {
	
	$scope.item = item;
	
	console.log("DIALOG CONTROLLER", item);
	
	$scope.checked = [];
	
    $scope.hide = function() {
      $mdDialog.hide();
    };

    $scope.cancel = function() {
      $mdDialog.cancel();
    };

    $scope.answer = function(answer) {
      $mdDialog.hide(answer);
    };
    
    $scope.toggle = function (item, list, $event) {
	    var idx = list.indexOf(item);
	    if (idx > -1) {
	      list.splice(idx, 1);
	    }
	    else {
	      list.push(item);
	    }
	    
	    $event.stopPropagation();
	};

	$scope.exists = function (item, list) {
		
		return list.indexOf(item) > -1;
	};
	
	$scope.onSuccess = function (x) {
		messageService.showMessage(x, "success");
	};
	
//	$scope.copy_to_clipboard = function(x){
//		copyText.select();
//        document.execCommand("copy");
//        console.log("CLIPBOARD", window.clipboardData);
//	};
}