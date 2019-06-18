app.controller('stepController', function($scope, userService, $state, $window, $location, $filter, apiService, moment, messageService, $document, $timeout, $mdDialog, $mdSidenav){
	
	$scope.state = $state;
	
	$scope.add_step = function(steps){
		var step = angular.copy($scope.templates.step);
		step.title = "Unnamed step " + (steps.length + 1);
		$scope.add_to_list(step, steps);
	};
	
//	$scope.add_executable = function(step){
//	if( ! step.executables ) step.executables = [];
//	step.executables.push(angular.copy($rootScope.templates.executable));
//};
	
	$scope.append_step = function(steps, step, index){
		if(index == undefined) steps.push(angular.copy(step));
		else steps.splice(index, 0, angular.copy(step));
	};
	
	$scope.cloneStep = function(step, steps, $event){
		$event.stopPropagation();
		console.log("[CLONE STEP]", step);
		copy = angular.copy(step)
		copy.title = "Copy of " + copy.title;
		
		$scope.append_step(steps, copy);
	};
	
	$scope.showImportStepDialog = function(steps, $event) {
		
		apiService.get_steps(function(result){
			  console.log("STEPS", result);
			  
			  var confirm = {
				    	controller: DialogController,
						templateUrl: 'templates/dialogs/import_step_dialog.html',
						parent: angular.element(document.body),
						targetEvent: $event,
						clickOutsideToClose:true,
						fullscreen: $scope.customFullscreen,
						resolve: {
						      item: function () {
						    	  return result.data;
						      }
						    }
				    };

				    $mdDialog.show(confirm).then(function(answer) {
				    	console.log("DIALOG ANSWER", answer);
				    	if (answer != "Cancel") {
				    		var already_existing = [];
				    		for(var i in steps)
				    			if (! already_existing.includes(steps[i].title))
				    				already_existing.push(steps[i].title);
				    		
		    				var queue = [];
				    		for(var i in answer)
				    			queue.push(answer[i]);
				    		
			    			var steps_to_import = [];
			    			while(queue.length > 0){
			    				var step = queue.pop();
			    				
			    				steps_to_import.push(step);
			    				
			    				for(var j in step.hpc_directives.dependencies){
				    				var dep = step.hpc_directives.dependencies[j];
				    				for(var k in result.data){
				    					var s = result.data[k];
				    					if (s.title == dep)
				    						if(!queue.includes(s))
				    							queue.push(s);
				    				}
			    				}
			    			}
			    			
				    		for(var i in steps_to_import)
				    			if(!already_existing.includes(steps_to_import[i].title))
				    				$scope.append_step(steps, steps_to_import[i]);
				    	}
				    }, function() {
				    });
		  });
	    
	    $event.stopPropagation();
	};
	
	$scope.create_condition = function(list){
		list.push(angular.copy($rootScope.templates.condition));
	};
	
	$scope.delete_condition = function(list, $index){
		$scope.delete_from_array(list, $index);
	};
	
	$scope.addStepToRepository = function(step, event){
		console.log("SAVING STEP", step);
		
		apiService.save_step_to_repository(step, false, function(resp){
			console.log(resp);
			var message = resp.data.message;
			messageService.showMessage(message, resp.data.type);
			
			if(resp.data.type == "error"){
				var confirm = $mdDialog.confirm()
		          .title('Message from server')
		          .textContent(message + "\n" + "Would you like to overwrite the existing step "+step.title+"?")
		          .targetEvent(event)
		          .ok('OK')
		          .cancel('Cancel');

			    $mdDialog.show(confirm).then(function() {
			    	console.log("You want to overwrite step " + step.title);
			    	apiService.save_step_to_repository(step, true, function(resp){
			    		messageService.showMessage("Step "+step.title+" has been overwritten", "info");
			    		
			    	}, function(resp) {
			    		console.log(resp);
			    		messageService.showMessage("Step "+step.title+" has not been overwritten", "info");
			    	});
			    }, function() {
			    	console.log("You changed your mind by pressing Cancel");
			    });
			}
			
		}, function(resp){
			messageService.showMessage(resp, "error");
			console.log('Error', resp);
		});
		
		event.stopPropagation();
	};
	
	$scope.remove_step = function(list, index, $event){
		
		var step = list[index];
		
		var removeFx = function(){
			// Find all the steps that depend on this step and remove the dependency
			for(var i=0; i<list.length; i++){
				var s = list[i];
				for(var j=0; j<s.hpc_directives.dependencies.length; j++){
					var d = s.hpc_directives.dependencies[j];
					if(d == step.title){
						console.log("FOUND A STEP WHICH DEPENDS ON THIS STEP", s);
						$scope.delete_from_array(s.hpc_directives.dependencies, j);
						
						for(var k=0; k<step.hpc_directives.dependencies.length; k++){
							var dep = step.hpc_directives.dependencies[k];
							if(!s.hpc_directives.dependencies.includes(dep))
								s.hpc_directives.dependencies.push(dep);
						}
						
						break;
					}
				}
			}
			
			$scope.delete_from_array(list, index);
		};
		
		$scope.showDeleteDialog(list, index, $event, function(list, index){
			console.log("REMOVING STEP", list, index);
			
			if($state.current.name == "step_repository") {
				apiService.delete_step_from_repository(list[index], function(result){
					messageService.showMessages(result.data);
					
					removeFx();
				}, function(error){
					console.log(error);
					messageService.showMessages(error.data);
				}, function(){});
			}
			else {
				removeFx();
			}
		});
	};
	
	$scope.toggleStep = function(step, steps, index, $event){
		step.skip = !step.skip;
		
		for(var j=0; j<steps.length; j++){
			var s = steps[j];
			if (s.hpc_directives.dependencies.includes(step.title))
				$scope.setStep(s, steps, j, step.skip);
		}
		
		if($event != undefined)
			$event.stopPropagation();
	};
	
	$scope.setStep = function(step, steps, index, value){
		step.skip = value;
		
		for(var j=0; j<steps.length; j++){
			var s = steps[j];
			if (s.hpc_directives.dependencies.includes(step.title))
				$scope.setStep(s, steps, j, value);
		}
	};
	
	$scope.showReplaceStep = function(steps, index, $event){
		var step = steps[index];
		
		apiService.get_steps(function(result){
			  console.log("STEPS", result);
			  
			  var confirm = {
				    	controller: DialogController,
						templateUrl: 'templates/dialogs/import_step_dialog.html',
						parent: angular.element(document.body),
						targetEvent: $event,
						clickOutsideToClose:true,
						fullscreen: $scope.customFullscreen,
						resolve: {
						      item: function () {
						    	  return result.data;
						      }
						    }
				    };

				    $mdDialog.show(confirm).then(function(answer) {
				    	console.log("DIALOG ANSWER", answer);
				    	if (answer != "Cancel") {
				    		
				    		var already_existing = [];
				    		for(var i in steps)
				    			if (! already_existing.includes(steps[i].title))
				    				already_existing.push(steps[i].title);
				    		
		    				var queue = [];
				    		for(var i in answer)
				    			queue.push(answer[i]);
				    		
			    			var steps_to_import = [];
			    			while(queue.length > 0){
			    				var el = queue.pop();
			    				
		    					steps_to_import.push(el);
			    				
			    				for(var j in el.hpc_directives.dependencies){
				    				var dep = el.hpc_directives.dependencies[j];
				    				for(var k in result.data){
				    					var s = result.data[k];
				    					if (s.title == dep)
				    						if(!queue.includes(s))
				    							queue.push(s);
				    				}
			    				}
			    			}
			    			
			    			// Calculate degrees
			    			var inEdgesCounter = {};
			    			var outEdgesCounter = {};
			    			for(var i in steps_to_import)
			    				inEdgesCounter[steps_to_import[i].title] = outEdgesCounter[steps_to_import[i].title] = 0;
			    			for(var i in steps_to_import)
			    			{
			    				var s = steps_to_import[i];
			    				for(var j in s.hpc_directives.dependencies){
			    					var dep = s.hpc_directives.dependencies[j];
			    					inEdgesCounter[s.title] += 1;
			    					outEdgesCounter[dep] += 1;
			    				}
			    			}
			    			
			    			// Find roots and leaves in S
			    			var roots = [];
			    			var leaves = [];
			    			for(var i in steps_to_import){
			    				if(inEdgesCounter[steps_to_import[i].title] == 0)
			    					roots.push(steps_to_import[i]);
			    				if(outEdgesCounter[steps_to_import[i].title] == 0)
			    					leaves.push(steps_to_import[i]);
			    			}
			    			console.log("ROOTS AND LEAVES", roots, leaves);
			    			
			    			// Link roots to A
			    			for(var i in roots)
			    				for(var j in step.hpc_directives.dependencies)
			    					roots[i].hpc_directives.dependencies.push(step.hpc_directives.dependencies[j]);
			    			
			    			// Unlink B from t and link leaves to B
			    			for(var i in steps){
			    				var s = steps[i];
			    				var modifyIt = false;
			    				for(var j in s.hpc_directives.dependencies)
			    					if(s.hpc_directives.dependencies[j] == step.title){
			    						modifyIt = true;
			    						break;
			    					}
			    				
			    				if(modifyIt){
			    					s.hpc_directives.dependencies.splice(s.hpc_directives.dependencies.indexOf(step.title), 1);
			    					console.log("ADDING LEAVES TO ", s.title, s, leaves);
			    					for(var j in leaves)
			    						if(!s.hpc_directives.dependencies.includes(leaves[j].title))
			    							s.hpc_directives.dependencies.push(leaves[j].title);
			    				}
			    			}
			    			
			    			console.log("STEPS TO IMPORT", steps_to_import, steps);
			    			
				    		for(var i in steps_to_import)
				    			if(!already_existing.includes(steps_to_import[i].title))
				    				$scope.append_step(steps, steps_to_import[i], index);
				    			else {
				    				for(var j in steps){
				    					var s = steps[j];
				    					if(s.title == steps_to_import[i].title){
				    						for(var k in steps_to_import[i].hpc_directives.dependencies){
				    							var d = steps_to_import[i].hpc_directives.dependencies[k];
				    							if(!s.hpc_directives.dependencies.includes(d))
				    								s.hpc_directives.dependencies.push(d)
				    						}
				    					}
				    				}
				    			}
				    		
				    		// Remove previous step
				    		var removeIt = true;
				    		for(var i in steps_to_import)
				    			if(steps_to_import[i].title == step.title){
				    				console.log("FOUND THE SAME STEP NAME IN THE STEPS_TO_IMPORT", steps_to_import[i], step);
				    				removeIt = false;
				    				break;
				    			}
				    		if(removeIt){
				    			var index = steps.indexOf(step);
				    			console.log("REMOVING STEP AT INDEX", index, steps[index]);
				    			$scope.delete_from_array(steps, index);
				    		}
				    		else {
				    			console.log("NOT REMOVING STEP AT INDEX", index, steps[index]);
				    		}
				    	}
				    }, function() {
				    });
		  });
	    
	    $event.stopPropagation();
	};
	
	$scope.showRenameStepDialog = function(steps, step, $event) {
		console.log(step);
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/rename_step_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        return step;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("RENAME DIALOG ANSWER", answer);
	    	
	    	if (answer != undefined && answer != "Cancel") {
	    		console.log("NEW NAME", answer);
	    		
	    		var renameFx = function(){
	    			// Find all the steps that depend on this step
		    		for(var i=0; i<steps.length; i++){
		    			var s = steps[i];
		    			for(var j=0; j<s.hpc_directives.dependencies.length; j++){
		    				var d = s.hpc_directives.dependencies[j];
		    				if(d == step.title){
		    					console.log("FOUND A STEP WHICH DEPENDS ON THIS STEP", s);
		    					s.hpc_directives.dependencies[j] = answer;
		    				}
		    			}
		    		}
		    		
		    		step.title = answer;
	    		};
	    		
	    		if($state.current.name == "step_repository") {
					apiService.rename_step_in_repository(step.title, answer, function(result){
						messageService.showMessages(result.data);
						
						renameFx();
					}, function(error){
						console.log(error);
						messageService.showMessages(error.data);
					}, function(){});
				}
				else {
					renameFx();
				}
	    	}
	    }, function() {
	    });
	    
	    $event.stopPropagation();
	};
	
//	$scope.addMonitorStepToRepository = function(step, event){
//	console.log("SAVING STEP", step);
//	
//	apiService.save_monitor_step_to_repository(step, function(resp){
//		console.log(resp);
//		var message = resp.data.message;
//		messageService.showMessage(message, resp.data.type);
//		
//		if(resp.data.type == "error"){
//			var confirm = $mdDialog.confirm()
//	          .title('Message from server')
//	          .textContent(message + "\n" + "Would you like to overwrite the existing step?")
//	          .targetEvent(event)
//	          .ok('OK')
//	          .cancel('Cancel');
//
//			$mdDialog.show(confirm).then(function() {
//		    	console.log("You want to overwrite the step");
//		    	apiService.save_monitor_step_to_repository(step, true, function(resp){
//		    		messageService.showMessage("Your step has been overwritten", "info");
//		    		
//		    	}, function(resp) {
//		    		messageService.showMessage("Your step has not been overwritten", "info");
//		    	});
//		    }, function() {
//		    	console.log("You changed your mind by pressing Cancel");
//		    });
//		}
//		
//	}, function(resp){
//		messageService.showMessage(resp, "error");
//		console.log('Error', resp);
//	});
//	
//	event.stopPropagation();
//};
});