app.controller('mainController', function($scope, apiService, moment, messageService, $document, $timeout, $mdDialog, $mdSidenav){
	$scope.projects = undefined;
	$scope.selected_project = undefined;
	$scope.selected_subproject = undefined;
	$scope.selected_step = undefined;
	
	$scope.keep_sidenav_open = true;
	
	var project_template = {
			"id": "",
			"img" : "imgs/project.png",
			"title": "",
			"subtitle": "",
	        "description": "",
	        "creator": "",
	        "creation_date": "",
	        "projects": [
            ]
	    };
	
	var subproject_template = {
    	"steps": [],
    	"dataset": {
    		"id": "",
    		"genome": "",
            "basedir": "",
            "create_per_sample_directory": true,
            "sample_ids": "",
            "sample_variable": "SAMPLE",
            "genome_variable": "GENOME",
            "all_samples_variable": "ALL_SAMPLES",
            "project_variable": "PROJECT",
            "project_index_variable": "PROJECT_INDEX"
        }
	};
	
	var step_template = {
			"type": "",
			"title": "",
	        "description": "",
	        "description_short": "",
	        "commandline": "",
	        "hpc_directives_text": "",
	        "hpc_directives": {
	        	"job_name": "",
                "walltime": "",
                "account": "",
                "nodes": 1,
                "cpu": 1,
                "mpi_procs": 0,
                "memory": {
                    "quantity": 1,
                    "size": 'GB'
                },
                "error": "",
                "output": "",
                "dependencies": []
            },
	        "modules": [],
	        "skip": false,
	        "conditions": [],
	    };
	
	var condition_template = {
		"command": ""	
	};
	
	$scope.genomes = [
		{
			id: "ig_Mus_musculus/mm10",
			organism: "Topo",
			name: "Mus musculus (10)",
			img: "imgs/genomes/mus_musculus.png"
		},
		{
			id: "ig_Mus_musculus/mm9",
			organism: "Topo",
			name: "Mus musculus (9)",
			img: "imgs/genomes/mus_musculus.png"
		},
		{
			id: "ig_Rattus_norvegicus/rn6",
			organism: "Ratto",
			name: "Rattus norvegicus (rn6)",
			img: "imgs/genomes/rattus.png"
		}
	];
	
//	var condition_template = {
//			"conditions": [],
//			"condition": {},
//			"op": ""
//	    };
//	
//	var ops = ["OR", "AND", "NOT"];
	
	$scope.sending = false;
	
	$scope.refresh = function(){
		apiService.get_projects(function(result){
			console.log("[REFRESH] AJAX RESULT", result);
			$scope.projects = result.data;
		});
	};
	
	$scope.toggle = function(){
		$mdSidenav('sidenav').toggle();
	};
	
// $scope.get_module_data = function(){
// return {
// "label": "Modules",
// "url": apiService.get_module_url()
// }
// };
	
	$scope.module_url = apiService.get_module_url();
	
	$scope.select_project = function(item){
		console.log("SELECTING PROJECT", item, $scope);
		$scope.selected_project = item;
		$mdSidenav('sidenav').close();
	};
	
	$scope.select_subproject = function(item){
		var subproject = $scope.selected_project.projects[item];
		console.log("SELECTING SUBPROJECT", subproject,  $scope);
		$scope.selected_subproject = subproject;
	};
	
	$scope.cloneSubproject = function(index, $event){
		$event.stopPropagation();
		console.log("[CLONE SUBPROJECT]", index, $scope.selected_project.projects[index]);
		$scope.selected_project.projects.push(angular.copy($scope.selected_project.projects[index]));
	};
	
	$scope.copy_steps = function(subproject){
		for(var i=0; i<$scope.selected_project.projects.length; i++){
			var subproj = $scope.selected_project.projects[i];
			if (subproj == subproject) continue;
			
			subproj.steps = angular.copy(subproject.steps);
		}
	};
	
	$scope.add_module = function(item, list){
		if(item != undefined){
			console.log("ADDED MODULE", item, list, $scope);
			list.push(item.label);
		}
	};
	
	$scope.remove_module = function(step, index){
		console.log("REMOVING MODULE", step, step.modules[index]);
		step.modules.splice(index, 1);
	};
	
	$scope.showAddProjectDialog = function(ev) {
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/add_project_dialog.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
				item: function(){
					return angular.copy(project_template);
				}
			}
	    };

	    $mdDialog.show(confirm).then(function(project) {
	    	if (project != undefined){
	    		
	    		project.creation_date = moment();
	    		
		    	console.log("NEW PROJECT", project);
		    	$scope.projects.push(project);
		    	$scope.save(project);
		    	$scope.select_project(project);
	    	}
	    }, function() {
	    });
	};
	
	$scope.onChangeLibrary = function(state){
		
	};
	
	$scope.toggleStep = function(index, $event){
		var step = $scope.selected_subproject.steps[index];
		step.skip = !step.skip;
		$event.stopPropagation();
	};
	
	$scope.get_total_samples = function(selected_project){
		var total = 0;
		
		for(var k=0; k<selected_project.projects.length; k++)
			total += selected_project.projects[k].dataset.sample_ids.split('\n').length;
		
		return total;
	};
	
	$scope.showDeleteProjectDialog = function(i, $event) {
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/delete_project_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        return $scope.projects[i];
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG ANSWER", answer);
	    	
	    	if (answer == "OK") {
	    		var project = $scope.projects[i];
	    		
	    		apiService.delete_project(project, function(result){
	    			console.log("[DELETE PROJECT] AJAX RESULT", result);
	    			messageService.showMessage(result.data, "success");
	    			
	    			$scope.projects.splice(i, 1);
		    		if($scope.selected_project == project)
		    			$scope.selected_project = undefined;
		    		
	    		}, function(result){
	    			console.log("[DELETE PROJECT] AJAX RESULT ERROR", result);
	    			messageService.showMessage("Server error: " + result.status, "error");
	    		});
	    	}
	    }, function() {
	    });
	    
	    $event.stopPropagation();
	};
	
	$scope.showDeleteSubprojectDialog = function(i, $event) {
		$scope.select_subproject(i);
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/delete_subproject_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		    	  console.log("[DIALOG DELETE SUBPROJECT]", $scope.selected_subproject);
		        return $scope.selected_subproject;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG ANSWER", answer);
	    	
	    	if (answer == "OK") $scope.remove_subproject($scope.selected_project, i);
	    }, function() {
	    });
	    
	    $event.stopPropagation();
	};
	
	$scope.remove_subproject = function(project, index){
		project.projects.splice(index, 1);
	};
	
	$scope.showDeleteStepDialog = function(i, $event) {
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/delete_step_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        return $scope.selected_subproject.steps[i];
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG ANSWER", answer);
	    	if (answer == "OK") $scope.remove_step($scope.selected_subproject, i);
	    }, function() {
	    });
	    
	    $event.stopPropagation();
	};
	
	$scope.add_subproject = function(project){
		console.log("[ADD SUBPROJECT]", project, subproject_template);
		project.projects.push(angular.copy(subproject_template));
	};
	
	$scope.add_step = function(project){
		project.steps.push(angular.copy(step_template));
	};
	
	$scope.remove_step = function(project, index){
		project.steps.splice(index, 1);
	};
	
	$scope.create_condition = function(list){
		list.push(angular.copy(condition_template));
	};
	
	$scope.delete_condition = function(list, $index){
		list.splice($index, 1);
	};
	
	$scope.move_item = function(list, index, offset, $event){
		var element = list.splice(index, 1)[0];
		
		var finalIndex = undefined;
		if (offset < 0) finalIndex = Math.max(0, index + offset);
		else finalIndex = Math.min(list.length, index + offset);

		list.splice(finalIndex, 0, element);
		$event.stopPropagation();
	};
	
	$scope.save = function(project){
		apiService.save_project(project, function(result){
			console.log("[SAVE PROJECT] AJAX RESULT", result);
			messageService.showMessage(result.data, "success");
		}, function(result){
			console.log("[SAVE PROJECT] AJAX RESULT ERROR", result);
			messageService.showMessage("Server error: " + result.status, "error");
		});
	};
	
	$scope.copy_hpc_directives = function(step){
		var copyFrom = undefined;
		for(var index in $scope.selected_subproject.steps)
		{
			var s = $scope.selected_subproject.steps[index];
			if (s.hpc_directives.account != "") {copyFrom = s; break;}
		}
		
		if(copyFrom != undefined)
			step.hpc_directives = angular.copy(copyFrom.hpc_directives);
	};
	
	$scope.select_step = function(index){
		console.log("STEP SELECTED", index, $scope);
		$scope.selected_step = $scope.selected_subproject.steps[index];
	};
	
	$scope.produce_scripts = function(project){
		apiService.produce_scripts(project, function(result){
			console.log("[PRODUCE SCRIPTS] AJAX RESULT", result);
			messageService.showMessage(result.data, "success");
		}, function(result){
			console.log("[PRODUCE SCRIPTS] AJAX RESULT ERROR", result);
			messageService.showMessage("Server error: " + result.status, "error");
		});
	};
	
	$scope.download_scripts = function(project){
		apiService.download_scripts(project, function(result){
			console.log("[DOWNLOAD SCRIPTS] AJAX RESULT", result);
			
			var url = result.data.url;
			var filename = result.data.filename;
			
			var downloadLink = angular.element('<a target="_self"></a>');
            downloadLink.attr('href', url);
            downloadLink.attr('download', filename);
            
            console.log(downloadLink, url, filename);
            
            var body = $document.find('body').eq(0);
            body.append(downloadLink)
            
			downloadLink[0].click();
		}, function(result){
			console.log("[DOWNLOAD SCRIPTS] AJAX RESULT ERROR", result);
			messageService.showMessage("Server error: " + result.status, "error");
		});
	};
	
	$scope.refresh();
});