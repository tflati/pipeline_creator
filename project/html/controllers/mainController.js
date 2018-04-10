app.controller('mainController', function($scope, apiService, messageService, $document, $timeout, $mdDialog, $mdSidenav){
	$scope.projects = undefined;
	$scope.selected_item = undefined;
	$scope.selected_step = undefined;
	
	$scope.keep_sidenav_open = true;
	
	var project_template = {
			"id": "",
			"img" : "imgs/project.png",
			"title": "",
			"subtitle": "",
	        "description": "",
	        "type": "",
        	"steps": [],
        	"dataset": {
                "basedir": "",
                "create_per_sample_directory": true,
                "sample_ids": "",
                "sample_variable": "SAMPLE",
                "all_samples_variable": "ALL_SAMPLES",
            },
	    };
	
	var step_template = {
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
                "output": ""
            },
	        "modules": []
	    };
	
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
	
//	$scope.get_module_data = function(){
//		return {
//			"label": "Modules",
//			"url": apiService.get_module_url()
//		}
//	};
	
	$scope.module_url = apiService.get_module_url();
	
	$scope.select_project = function(item){
		$scope.selected_item = item;
		$mdSidenav('sidenav').close();
	};
	
	$scope.add_module = function(item){
		if(item != undefined){
			console.log("ADDED MODULE", item, $scope);
			$scope.selected_step.modules.push(item.label);
		}
	};
	
	$scope.remove_module = function(step, index){
		console.log("REMOVING MODULE", step, step.modules[index]);
		step.modules.splice(index, 1);
	};
	
	$scope.showAddProjectDialog = function(ev) {
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/add_project_dialog.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
				item: function(){
					return Object.assign({}, project_template);
				}
			}
	    };

	    $mdDialog.show(confirm).then(function(project) {
	    	if (project != undefined){
		    	console.log("NEW PROJECT", project);
		    	$scope.projects.push(project);
		    	$scope.save(project);
		    	$scope.select_project(project);
	    	}
	    }, function() {
	    });
	};
	
	$scope.showDeleteDialog = function(i, ev) {
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/delete_project_dialog.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        return $scope.projects[i];
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	if (answer == "OK"){
		    	console.log("DIALOG ANSWER", answer);
		    	$scope.projects.splice(i, 1);
	    	}
	    }, function() {
	    });
	};
	
	$scope.showDeleteStepDialog = function(i, ev) {
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/delete_step_dialog.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        return $scope.selected_item.steps[i];
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	if (answer == "OK"){
		    	console.log("DIALOG ANSWER", answer);
		    	$scope.remove_step($scope.selected_item, i);
	    	}
	    }, function() {
	    });
	};
	
	$scope.init_pipeline = function(project){
		project.steps = [];
		$scope.add_step(project);
	};
	
	$scope.add_step = function(project){
		project.steps.push(Object.assign({}, step_template));
	};
	
	$scope.remove_step = function(project, index){
		project.steps.splice(index, 1);
	};
	
	$scope.move_item = function(list, index, offset, $event){
		var element = list.splice(index, 1)[0];
		
		var finalIndex = undefined;
		if (offset < 0) finalIndex = Math.max(0, index + offset);
		else finalIndex = Math.min(list.length, index + offset);

		console.log("STEP MOVE", index);
		
		list.splice(finalIndex, 0, element);
		$event.stopPropagation();
	};
	
	$scope.save = function(project){
		apiService.save_project(project, function(result){
			console.log("[SAVE PROJECT] AJAX RESULT", result);
			messageService.showMessage(result.data);
		});
	};
	
	$scope.copy_hpc_directives = function(step){
		var copyFrom = undefined;
		for(var index in $scope.selected_item.steps)
		{
			var s = $scope.selected_item.steps[index];
			console.log("COPY", s);
			if (s.hpc_directives.account != "") {copyFrom = s; break;}
		}
		
		if(copyFrom != undefined)
			step.hpc_directives = Object.assign({}, copyFrom.hpc_directives);
	};
	
	$scope.select_step = function(index){
		console.log("STEP SELECTED", index);
		$scope.selected_step = $scope.selected_item.steps[index];
	};
	
	$scope.produce_scripts = function(project){
		apiService.produce_scripts(project, function(result){
			console.log("[PRODUCE SCRIPTS] AJAX RESULT", result);
			messageService.showMessage(result.data);
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
		});
	};
	
	$scope.refresh();
});