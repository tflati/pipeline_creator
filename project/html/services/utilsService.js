app.run(function($rootScope, apiService, $mdDialog) {
	
	apiService.get_templates(function(result){
		console.log("PIPELINER TEMPLATES", result);
		$rootScope.templates = result.data;
	});
	
	$rootScope.clone = function(list, index, $event){
		$event.stopPropagation();
		console.log("[CLONE]", index, list[index]);
		
		copy = angular.copy(list[index]);
		copy.id = "Copy of " + copy.id;
		if (copy.creation_date)
			copy.last_modified = copy.creation_date = moment().format('YYYY-MM-DD HH:mm:ss');
		
		return copy;
	};
	
	$rootScope.add_to_list = function(item, list){
		if (list == undefined) list = [];
		
		if(item != undefined && list != undefined){
			console.log("ADDED ITEM", item, list);
			list.push(item);
		}
	};
	
	$rootScope.write_note = function(e, $event){
		console.log("WRITE NOTE");
		
		if(e.note == undefined) e.note = "";
		
	    $mdDialog.show({
	      controller: DialogController,
	      templateUrl: 'templates/dialogs/note_dialog.html',
	      parent: angular.element(document.body),
	      targetEvent: $event,
		  fullscreen: true,
	      clickOutsideToClose:true,
	      resolve: {
				item: function(){
					return e.note;
				}
			}
	    })
	    .then(function(answer) {
	    	if (answer != "Cancel")
	    		e.note = answer;
	    	console.log("NOTE", answer, e);
	    }, function(a) {
	    });
	    
	    $event.stopPropagation();
	};
	
	$rootScope.delete_from_array = function(a, i){
		console.log("[DELETE ELEMENT FROM ARRAY]", a[i], a);
		a.splice(i, 1);
	};
	
	$rootScope.move_item = function(list, index, offset, $event){
		var element = list.splice(index, 1)[0];
		
		var finalIndex = undefined;
		if (offset < 0) finalIndex = Math.max(0, index + offset);
		else finalIndex = Math.min(list.length, index + offset);

		list.splice(finalIndex, 0, element);
		$event.stopPropagation();
	};
	
	$rootScope.showDeleteDialog = function(list, i, $event, callback) {
		
		var item = list[i];
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/delete_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $rootScope.customFullscreen,
			resolve: {
		      item: function () {
		    	  console.log("[DIALOG DELETE]", item);
		        return item;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG ANSWER", answer);
	    	
	    	if (answer == "OK"){

	    		if(callback != undefined)
	    			callback(list, i);
	    		else
	    			$rootScope.delete_from_array(list, i);
	    	}
	    }, function() {
	    });
	    
	    $event.stopPropagation();
	};
	
	$rootScope.showConfirmDialog = function(title, question, text, list, i, $event, callback) {
		$event.stopPropagation();
		
		var confirm = $mdDialog.confirm()
        .title(question)
        .textContent(text)
        .ariaLabel(title)
        .targetEvent($event)
        .ok('OK')
        .cancel('Cancel');
		
	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG ANSWER POST", answer);
	    	
	    	if (answer)
	    		if(callback != undefined)
	    			callback(list, i);
	    }, function() {
	    });
	};
});