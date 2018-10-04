app.controller('mainController', function($scope, $location, apiService, moment, globalService, messageService, $document, $timeout, $mdDialog, $mdSidenav){
	
	$scope.projects = undefined;
	$scope.selected_project = undefined;
	$scope.selected_subproject = undefined;
	$scope.selected_experiment = undefined;
	$scope.selected_pipeline = undefined;
	$scope.checked_subproject = [];
//	$scope.selected_step = undefined;
	$scope.color = "FF0000";
	$scope.keep_sidenav_open = true;
	$scope.selected_tab = 0;
	
	$scope.globalService = globalService;
	
	var project_template = {
			"id": "",
			"img" : "imgs/project.png",
			"title": "",
			"subtitle": "",
	        "description": "",
	        "creator": "",
	        "creation_date": "",
	        "type": "project",
	        "pipelines": [],
	        "projects": []
	    };
	
	var subproject_template = {
			"id": "",
			"disabled": false,
			"type": "bioproject",
			"experiments": []
	};
	
	var experiment_template = {
			"type": "experiment",
			"id": "",
			"dataset": {
	    		"cluster": "",
	    		"genome": "",
	            "basedir": "",
	            "create_per_sample_directory": true,
	            "pairedend": false,
	            "sample_ids": "",
	            "tags": []
	        }
	};
	
	var pipeline_template = {
		"id": "",
		"steps": [],
    	"disabled": false,
    	"tags": [],
		"variables": [
            {
            	"key": "sample_variable",
            	"key_disabled": true,
            	"value": "SAMPLE",
            	"description": "Variable to use across scripts to refer to a sample in this project"
            },
            {
            	"key": "all_samples_variable",
            	"key_disabled": true,
            	"value": "ALL_SAMPLES",
            	"description": "Variable to use across scripts to refer to ALL samples in this project"
            },
            {
            	"key": "project_variable",
            	"key_disabled": true,
            	"value": "PROJECT",
            	"description": "Variable to use across scripts to refer to this project ID"	            	
            },
            {
                "description": "Variable to use across scripts to refer to the experiment ID",
                "key": "experiment_variable",
                "key_disabled": true,
                "value": "EXPERIMENT"
            },
            {
            	"key": "project_index_variable",
            	"key_disabled": true,
            	"value": "PROJECT_INDEX",
            	"description": "Variable to use across scripts to refer to the index of this project"
            },
            {
            	"key": "cpu_variable",
            	"key_disabled": true,
            	"value": "CPU",
            	"description": "Variable to use across scripts to refer to the number of CPU defined in a step"
            },
            {
            	"key": "step_name_variable",
            	"key_disabled": true,
            	"value": "STEP_NAME",
            	"description": "Variable to use across scripts to refer to the name of the step"
            }
    	]
	};
	
	var step_template = {
			"title": "",
	        "description": "",
	        "description_short": "",
	        "commandline": "",
	        "executable": [],
	        "checks": [],
	        "hpc_directives_text": "",
	        "hpc_directives": {
	        	"job_name": "",
                "walltime": "",
                "account": "",
                "nodes": 1,
                "cpu": 1,
                "queue": "",
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
	        "script_level": "sample",
	        "command_level": "sample",
	        "command_parallelism_level": "sequential",
	        "command_group_level": "all",
	        "command_chunk_size": 1,
	        "write_stdout_log": true,
	        "write_stderr_log": true,
	        "conditions": [],
	    };
	
	var executable_template = {
		"filename": "",
		"command": ""
	};
	
	var condition_template = {
		"command": ""
	};
	
	var check_template = {
		"file": ""
	};
	
	var variable_template = {
    	"key": "variable_key",
    	"value": "value",
    	"description": "Variable to use across scripts to refer to XXXXX"	            	
    };
	
	$scope.genomes = [];
	
	$scope.load_genomes = function(clusterId){
		console.log("LOADING GENOMES", clusterId);
		
		return $timeout(function() {
			$scope.genomes = [];
			apiService.get_genomes(clusterId, function(result){
				console.log("GENOMES", result);
				$scope.genomes = result.data;
			});
		}, 1000);
	};
	
	$scope.load_qos = function(clusterId){
		console.log("LOADING QOS", clusterId);
		
		return $timeout(function() {
			$scope.genomes = [];
			apiService.get_qos(clusterId, function(result){
				console.log("QOS", result);
				$scope.queues = result.data;
			});
		}, 1000);
	};
	
	$scope.cluster_changed = function(clusterId){
		console.log("CHANGED CLUSTER", clusterId, $scope);
		$scope.module_url = apiService.get_module_url(clusterId);
		console.log("MODULE URL", $scope.module_url);
	};
	
	$scope.queue_changed = function(pipeline, queue){
		console.log("CHANGED QUEUE", pipeline, queue);
		angular.forEach(pipeline.steps, function(step){
			step.hpc_directives.queue = queue;
		});
	};
	
	$scope.clusters = [
		{
			"name": "Galileo",
			"id": "galileo",
			"info": "360 nodes (36 cores, 128GB) + 40 nodes (16 cores, 128GB)"
		},
		{
			"name": "Marconi",
			"id": "marconi",
			"info": "A1/BDW: 720 nodes (36 cores, 128GB) + A2/KNL: 3600 nodes (68 cores, 93GB)"
		},
		{
			"name": "Pico",
			"id": "pico",
			"info": "51 nodes (20 cores, 128GB) + 1 BigMem (32 cores, 520GB) + 2 BigMem (20 cores, 510GB)"
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
	
	$scope.xls_loaded = function(data){
		console.log("MAIN CONTROLLER XLS", data, $scope);
		messageService.showMessage("Loaded " + data.length + " samples.", "success");
		$scope.selected_subproject.dataset.sample_ids = data;
	};
	
	$scope.refresh = function(){
		apiService.get_projects(function(result){
			console.log("[REFRESH] AJAX RESULT", result);
			$scope.projects = result.data;
			for(i in $scope.projects){
				$scope.projects[i]["creation_epoch"] = moment($scope.projects[i].creation_date).unix();
			}
			
			var path = $location.hash();
			console.log("PATH", path);
			var pieces = path.split("/");
			for (var i in pieces){
				var piece = pieces[i];
				console.log("PIECE", piece);
				
				if (i==0) {
					for(var j in $scope.projects){
						var project = $scope.projects[j];
						if (project.id == piece){
							$scope.select_project(project);
						}
					}
					if($scope.selected_project == undefined)
						console.log("NO PROJECT SELECTED");
				}
				else if (i==1) {
					if (piece == "dataset") $scope.selected_tab = 0;
					else if (piece == "pipeline") $scope.selected_tab = 1;
					else if (piece == "monitor") $scope.selected_tab = 2;
					else if (piece == "info") $scope.selected_tab = 3;
					console.log("SELECTED TAB", $scope.selected_tab);
				}
				else if (i==2) {
					for(var j in $scope.selected_project.pipelines){
						var pipeline = $scope.selected_project.pipelines[j];
						if (pipeline.id == piece){
							$scope.select_pipeline(j);
						}
					}
				}
			}
		});
	};
	
	$scope.toggleMenu = function(){
		$mdSidenav('sidenav').toggle();
	};
	
// $scope.get_module_data = function(){
// return {
// "label": "Modules",
// "url": apiService.get_module_url()
// }
// };
	
	// $scope.module_url = apiService.get_module_url();
	
	$scope.select_project = function(item){
		
		console.log("SELECTING PROJECT", item, $scope);
		$scope.selected_project = item;
		
		$scope.bioproject2data = undefined;
		$scope.begin = 0;
		$mdSidenav('sidenav').close();
	};
	
	$scope.select_subproject = function(item){
		var subproject = $scope.selected_project.projects[item];
		console.log("SELECTING SUBPROJECT", subproject,  $scope);
		$scope.selected_subproject = subproject;
	};
	
	$scope.select_experiment = function(item){
		var experiment = $scope.selected_subproject.experiments[item];
		console.log("SELECTING EXPERIMENT", experiment,  $scope);
		$scope.selected_experiment = experiment;
	};
	
	$scope.select_pipeline = function(item, id, pane){
		var pipeline = $scope.selected_project.pipelines[item];
		console.log("SELECTING PIPELINE", pipeline,  $scope, id, pane);
		$scope.selected_pipeline = pipeline;
		$scope.module_url = apiService.get_module_url(pipeline.cluster);
		$scope.account_url = apiService.get_account_url(pipeline.cluster);
		
//		var b = $accordion.hasExpandedPane();
//		console.log("EXPANDED", b);
//		if (!b) $accordion.expand(item)
	};
	
	$scope.cloneSubproject = function(index, $event){
		$event.stopPropagation();
		console.log("[CLONE SUBPROJECT]", index, $scope.selected_project.projects[index]);
		
		copy = angular.copy($scope.selected_project.projects[index]);
		copy.dataset.id = "Copy of " + copy.id;
		
		$scope.selected_project.projects.push(copy);
	};
	
	$scope.clonePipeline = function(index, $event){
		$event.stopPropagation();
		console.log("[CLONE PIPELINE]", index, $scope.selected_project.pipelines[index]);
		
		copy = angular.copy($scope.selected_project.pipelines[index]);
		copy.id = "Copy of " + copy.id;
		
		$scope.selected_project.pipelines.push(copy);
	};
	
	$scope.cloneStep = function(step, $event){
		$event.stopPropagation();
		console.log("[CLONE STEP]", step);
		copy = angular.copy(step)
		copy.title = "Copy of " + copy.title;
		$scope.selected_pipeline.steps.push(copy);
	};
	
	$scope.copy_steps = function(subproject){
		for(var i=0; i<$scope.selected_project.projects.length; i++){
			var subproj = $scope.selected_project.projects[i];
			if (subproj == subproject) continue;
			
			subproj.steps = angular.copy(subproject.steps);
		}
	};
	
	$scope.add_to_list = function(item, list){
		if(item != undefined){
			console.log("ADDED ITEM", item, list, $scope);
			list.push(item);
		}
	};
	
	$scope.select_account = function(pipeline, accountItem){
		console.log("SELECTED ACCOUNT: ", accountItem);
		angular.forEach(pipeline.steps, function(step){
			step.hpc_directives.account = accountItem.label;
		});
	};
	
//	$scope.extract_variables = function(check, pipeline){
//		var variables = [];
//		
////		console.log("CHECK VARIABLES", check);
//		
//		var command = check.commandline;
//		
//		var i = 0;
////		while(i >= 0){
//			i = command.indexOf("${", i);
//			if (i == -1) continue;
//			
//			var j = command.indexOf("}", i);
//			if (j == -1) continue;
//			
//			var substring = command.substring(i, j+1);
//			
//			variables.push({
//				key: substring,
//				value: ""
//			});
//			
//			i = j+1;
////		}
//		
//		return variables;
//	}
	
	$scope.remove_from_list = function(list, index){
		console.log("REMOVING ITEM", list, index);
		list.splice(index, 1);
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
	
	$scope.toggleStep = function(step, $event){
		step.skip = !step.skip;
		$event.stopPropagation();
	};
	
	$scope.get_total_samples = function(selected_project){
		var total = 0;
		
		for(var k=0; k<selected_project.projects.length; k++){
			var subproject = selected_project.projects[k];
		
			for(var j=0; j<subproject.experiments.length; j++)
				total += subproject.experiments[j].dataset.sample_ids.length;
		}
		
		return total;
	};
	
	$scope.get_total_samples_subproject = function(selected_subproject){
		var total = 0;
		
		for(var j=0; j<selected_subproject.experiments.length; j++)
			total += selected_subproject.experiments[j].dataset.sample_ids.length;
		
		return total;
	};
	
	$scope.get_total_samples_experiment = function(experiment){
		return experiment.dataset.sample_ids.length;
	};
	
	$scope.get_samples = function(selected_project){
		var ids = [];
		
		for(var k=0; k<selected_project.projects.length; k++){
			var subproject = selected_project.projects[k];
			
			for(var j=0; j<subproject.experiments.length; j++){
				var biosample_id = subproject.experiments[j].dataset.biosample_id;
				if(biosample_id)
					ids.push(biosample_id);
			}
		}
		
		return ids;
	};
	
	$scope.get_platforms = function(selected_project){
		var platforms = {};
		
		for(var k=0; k<selected_project.projects.length; k++)
		{
			var subproject = selected_project.projects[k];
			
			for(var j=0; j<subproject.experiments.length; j++){
				var platform = subproject.experiments[j].dataset.platform;
				platforms[platform] = 1;
			}
		}
		
		return Object.keys(platforms);
	};
	
	$scope.get_paper_projects = function(selected_project){
		if($scope.bioproject2data) return $scope.bioproject2data;
		else
		{
			$scope.bioproject2data = {};
			for(var k=0; k<selected_project.projects.length; k++)
			{
				var subproject = selected_project.projects[k];
				
				var bioproject_id = subproject.id;
				if (! (bioproject_id in $scope.bioproject2data) )
				{
					$scope.bioproject2data[bioproject_id] = {
						"bioprojects": [],
						"runs": [],
						"experiments": [],
						"samples": [],
						"organisms": [],
						"size": 0,
						"papers": [],
						"platforms": [],
						"layouts": []
					};
				}
				
				for(var j=0; j<subproject.experiments.length; j++){
					
					var experiment = subproject.experiments[j];
					
					var paper = experiment.dataset.paper_id;
					var biosample_id = experiment.dataset.biosample_id;
					var experiment_id = experiment.id;
					var organism = experiment.dataset.genome;
					var size = experiment.dataset.size;
					var platform = experiment.dataset.platform;
					var layout = experiment.dataset.pairedend ? "PE": "SE";
					if(paper != undefined && $scope.bioproject2data[bioproject_id]["papers"].indexOf(paper) == -1) $scope.bioproject2data[bioproject_id]["papers"].push(paper);
					for(var i in experiment.dataset.sample_ids){
						var sample = experiment.dataset.sample_ids[i];
						if(sample["id"] in $scope.bioproject2data[bioproject_id]["runs"]) continue;
						$scope.bioproject2data[bioproject_id]["runs"].push(sample["id"]);
					}
					if($scope.bioproject2data[bioproject_id]["samples"].indexOf(biosample_id) == -1) $scope.bioproject2data[bioproject_id]["samples"].push(biosample_id);
					if($scope.bioproject2data[bioproject_id]["experiments"].indexOf(experiment_id) == -1) $scope.bioproject2data[bioproject_id]["experiments"].push(experiment_id);
					if($scope.bioproject2data[bioproject_id]["organisms"].indexOf(organism) == -1) $scope.bioproject2data[bioproject_id]["organisms"].push(organism);
					if($scope.bioproject2data[bioproject_id]["platforms"].indexOf(platform) == -1) $scope.bioproject2data[bioproject_id]["platforms"].push(platform);
					$scope.bioproject2data[bioproject_id]["size"] += size;
					if($scope.bioproject2data[bioproject_id]["layouts"].indexOf(layout) == -1) $scope.bioproject2data[bioproject_id]["layouts"].push(layout);
				}
			}
			
			console.log("GET PAPER PROJECTS", $scope.bioproject2data);
		}
		
		return $scope.bioproject2data;
	};
	
	var DynamicItems = function(elements) {
		this.elements = elements;
	};
	DynamicItems.prototype.getItemAtIndex = function(index) {
		return this.elements[index];
      };
	DynamicItems.prototype.getLength = function() {
        return this.elements.length;
      };
      
    $scope.paginationNext = function(list){
    	console.log("PAGINATION", $scope.begin, list);
    	if ($scope.begin+10 < list.length) $scope.begin += 10;
    };
    
    $scope.paginationPrevious = function(){
    	$scope.begin -= 10;
    	if( $scope.begin < 0) $scope.begin = 0;
    };
    $scope.paginationFirst = function(){
    	$scope.begin = 0;
    };
    $scope.paginationLast = function(list){
    	$scope.begin = list.length-10;
    };
    
    
    $scope.get_total_bytes = function(selected_project){
    	var total = 0;
//    	console.log("PROJECT", selected_project);
    	for(var k=0; k<selected_project.projects.length; k++){
    		var subproject = selected_project.projects[k];
//    		console.log("BIOPROJECT", subproject);
    		for(var j=0; j<subproject.experiments.length; j++)
    			total += subproject.experiments[j].dataset.size;
    	}
    	
    	return total;
    };
    
	
	$scope.get_papers = function(selected_project){
		var papers = {};
		
		for(var k=0; k<selected_project.projects.length; k++)
		{
			var subproject = selected_project.projects[k]; 
			
			for(var j=0; j<subproject.experiments.length; j++){
				var paper = subproject.experiments[j].dataset.paper_id;
				if(paper) papers[paper] = 1;
			}
		}
		
		return Object.keys(papers);
	};
	
	$scope.get_total_samples_pe = function(selected_project){
		var total = 0;
		
		for(var k=0; k<selected_project.projects.length; k++){
			var subproject = selected_project.projects[k]; 
		
			for(var j=0; j<subproject.experiments.length; j++){
				var experiment = subproject.experiments[j];
				if(experiment.dataset.pairedend)
					total += experiment.dataset.sample_ids.length;
			}
		}
		
		return total;
	};
	
	$scope.get_total_samples_se = function(selected_project){
		var total = 0;
		
		for(var k=0; k<selected_project.projects.length; k++){
			var subproject = selected_project.projects[k]; 
			
			for(var j=0; j<subproject.experiments.length; j++){
				var experiment = subproject.experiments[j];
				if(!experiment.dataset.pairedend)
				total += experiment.dataset.sample_ids.length;
			}
		}
		
		return total;
	};
	
	$scope.get_total_bioprojects = function(selected_project){
		var bioproject_ids = {};
		
		for(var k=0; k<selected_project.projects.length; k++)
		{
			var bioproject_id = selected_project.projects[k].id;
			bioproject_ids[bioproject_id] = 1;
		}
		
		return Object.keys(bioproject_ids).length;
	};
	
	$scope.get_genomes = function(selected_project){
		var genomes = {};
		
		for(var k=0; k<selected_project.projects.length; k++)
		{
			var subproject = selected_project.projects[k]; 
		
			for(var j=0; j<subproject.experiments.length; j++){
				var genome = subproject.experiments[j].dataset.genome;
				genomes[genome] = 1;
			}
		}
		
		return Object.keys(genomes);
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
	
	$scope.isIndeterminate = function() {
		return ($scope.checked_subproject.length !== 0 &&
				$scope.checked_subproject.length !== $scope.selected_project.projects.length);
	};

	$scope.isChecked = function() {
		return $scope.checked_subproject.length === $scope.selected_project.projects.length;
	};
	
	$scope.isSEChecked = false;
	$scope.isPEChecked = false;

	$scope.toggleAll = function() {
		if ($scope.checked_subproject.length === $scope.selected_project.projects.length) {
	      $scope.checked_subproject = [];
	    } else if ($scope.checked_subproject.length === 0 || $scope.checked_subproject.length > 0) {
	      $scope.checked_subproject = $scope.checked_subproject.concat($scope.selected_project.projects.slice(0));
	    }
		
		$scope.isSEChecked = $scope.isPEChecked = $scope.isChecked();
	};
	
	$scope.toggleAllSE = function() {
		if ($scope.isSEChecked) {
			$scope.checked_subproject = $scope.checked_subproject.slice(0).filter(function(p){return p.dataset.pairedend == true;});
	    } else {
	    	$scope.checked_subproject = $scope.checked_subproject.concat($scope.selected_project.projects.slice(0).filter(function(p){return p.dataset.pairedend == false;}));
	    }
		
		$scope.isSEChecked = !$scope.isSEChecked;
//		if($scope.isSEChecked) $scope.isPEChecked = false;
	};
	
	$scope.toggleAllPE = function() {
		if ($scope.isPEChecked) {
			$scope.checked_subproject = $scope.checked_subproject.slice(0).filter(function(p){return p.dataset.pairedend == false;});
	    } else {
	    	$scope.checked_subproject = $scope.selected_project.projects.slice(0).filter(function(p){return p.dataset.pairedend == true});
	    }
		
		$scope.isPEChecked = !$scope.isPEChecked;
//		if($scope.isPEChecked) $scope.isSEChecked = false;
	};
	  
	$scope.showDeleteProjectDialog = function(project, $event) {
		console.log($scope.projects, project);
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/delete_project_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        return project;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG ANSWER", answer);
	    	
	    	if (answer == "OK") {
	    		apiService.delete_project(project, function(result){
	    			console.log("[DELETE PROJECT] AJAX RESULT", result);
	    			messageService.showMessage(result.data, "success");
	    			
	    			var i = $scope.projects.indexOf(project);
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
	
	$scope.showRenameProjectDialog = function(project, $event) {
		console.log($scope.projects, project);
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/rename_project_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        return project;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("RENAME DIALOG ANSWER", answer);
	    	
	    	if (answer != undefined && answer != "Cancel") {
	    		console.log("NEW NAME", answer);
	    		
	    		new_project = angular.copy(project);
	    		new_project.id = answer;
	    		
	    		apiService.save_project(new_project, function(result){
	    			
	    			apiService.delete_project(project, function(result){
		    			messageService.showMessage("PROJECT "+project.id+" CORRECTLY RENAMED AS " + answer, "success");
		    			
		    			project.id = answer;
			    		
		    		}, function(result){
		    			console.log("[DELETE OLD - RENAME PROJECT] AJAX RESULT ERROR", result);
		    			messageService.showMessage("Server error: " + result.status, "error");
		    		});
	    			
	    		}, function(result){
	    			console.log("[SAVE NEW - RENAME PROJECT] AJAX RESULT ERROR", result);
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
	
	$scope.showDeletePipelineDialog = function(i, $event) {
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/delete_pipeline_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        return $scope.selected_project.pipelines[i];
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG ANSWER", answer);
	    	
	    	if (answer == "OK") {
	    		console.log("[DIALOG DELETE PIPELINE]", $scope.selected_project.pipelines[i]);
	    		$scope.delete_pipeline($scope.selected_project.pipelines, i);
	    	}
	    }, function() {
    	});
	    
	    $event.stopPropagation();
	};
	
	$scope.uploadFiles = function(files){
		if (files && files.length) {
			$scope.file_sending = true;
			apiService.upload_samples(files, function(resp){
				console.log('Success', resp);
				for(var i in resp.data)
				{
					var subproject_data = resp.data[i];
					$scope.add_subproject($scope.selected_project, subproject_data);
				}
				
				$scope.file_sending = false;
				$scope.bioproject2data = undefined;
				
			}, function(resp){
				console.log('Error status: ', resp);
				
				$scope.file_sending = false;
			});
		}
	};
	
	$scope.addPipelineToRepository = function(pipeline, $event){
		console.log("SAVING PIPELINE", pipeline);
		
		apiService.upload_pipeline(pipeline, function(resp){
			console.log(resp);
			var message = resp.data.message;
			messageService.showMessage(message, resp.data.type);
			
		}, function(resp){
			messageService.showMessage(resp, "warn");
			console.log('Error', resp);
		});
		
		$event.stopPropagation();
	};
	
	$scope.create_projects_from_list = function($event){
		var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/create_projects_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		    	  return $scope.selected_project;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("CREATE PROJECT DIALOG ANSWER", answer);
	    	if (answer != "Cancel" && answer != undefined) {
	    		$scope.file_sending = true;
	    		
	    		apiService.create_projects(answer, function(resp){
	    			console.log('Success', resp);
	    			var duplicated_bioprojects = 0;
	    			var imported_bioprojects = 0;
	    			var not_in_sra = 0;
	    			
	    			for(var i in resp.data)
	    			{
	    				var subproject_data = resp.data[i];
	    				
						if($scope.selected_project.projects.find(function(element){
	    					return element.id == subproject_data.id;
	    				}) != undefined) {
	    					duplicated_bioprojects++;
	    					continue;
	    				}
	    				
	    				imported_bioprojects++;
	    				
	    				if(subproject_data.experiments.length == 0)
	    					not_in_sra++;
	    				
	    				$scope.add_subproject($scope.selected_project, subproject_data);
	    			}
	    			
	    			$scope.file_sending = false;
    				$scope.bioproject2data = undefined;
	    			
	    			var message = imported_bioprojects + " new bioprojects correctly imported. " + not_in_sra + " bioprojects not in SRA. ("+duplicated_bioprojects + " duplicated bioprojects have been discarded)";
	    			console.log(message);
	    			messageService.showMessage(message);
	    			
	    		}, function(resp){
	    			console.log('Error status: ', resp);
	    			
	    			$scope.file_sending = false;
	    		});
	    	}
	    }, function() {
	    });
	};
	
	$scope.remove_subproject = function(project, index){
		project.projects.splice(index, 1);
	};
	
	$scope.showDeleteStepDialog = function(step, $event) {
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/delete_step_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        // return $scope.selected_subproject.steps[i];
		    	  return step;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG ANSWER", answer);
	    	if (answer == "OK") $scope.remove_step($scope.selected_pipeline.steps, $scope.selected_pipeline.steps.indexOf(step));
	    }, function() {
	    });
	    
	    $event.stopPropagation();
	};
	
	$scope.add_empty_subproject = function(project){
		console.log("[ADD EMPTY SUBPROJECT]", project, subproject_template);
		project.projects.push(angular.copy(subproject_template));
	};
	
	$scope.add_subproject = function(project, subproject){
		console.log("[ADD SUBPROJECT]", project, subproject);
		project.projects.push(subproject);
	};
	
	$scope.add_empty_experiment = function(project){
		console.log("[ADD EMPTY SUBPROJECT]", project, experiment_template);
		project.experiments.push(angular.copy(experiment_template));
	};
	
	$scope.add_experiment = function(project, experiment){
		console.log("[ADD EXPERIMENT]", project, experiment);
		project.experiments.push(experiment);
	};
	
	$scope.add_pipeline = function(project){
		console.log("[ADD PIPELINE]", project, pipeline_template);
		project.pipelines.push(angular.copy(pipeline_template));
	};
	
	$scope.delete_subprojects = function(project){
		console.log("[DELETE SUBPROJECTs]", project);
		for(var i in $scope.checked_subproject)
		{
			var subproject = $scope.checked_subproject[i];
			var index = project.projects.indexOf(subproject);
			project.projects.splice(index, 1);
		}
		
		$scope.checked_subproject = [];
		if(project.projects.length == 0)
			$scope.bioproject2data = undefined;
	};
	
	$scope.delete_pipeline = function(pipelines, i){
		console.log("[DELETE PIPELINE]", pipelines[i]);
		pipelines.splice(i, 1);
	};
	
	$scope.import_pipeline = function(selected_project, $event){
		var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/import_pipeline_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		    	  return globalService["pipelines"];
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG IMPORT PIPELINE ANSWER", answer);
	    	if (answer != "Cancel") {
	    		for(var i in answer){
	    			selected_project.pipelines.push(answer[i]);
	    		}
	    	}
	    }, function() {
	    });
	};
	
	$scope.add_executable = function(step){
		if( ! step.executables ) step.executables = [];
		step.executables.push(angular.copy(executable_template));
	};
	
	$scope.add_step = function(pipeline){
		pipeline.steps.push(angular.copy(step_template));
	};
	
	$scope.append_step = function(pipeline, step){
		pipeline.steps.push(angular.copy(step));
	};
	
	$scope.showCopyStepDialog = function(pipeline, $event) {
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/copy_step_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		    	  return $scope.selected_project;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG ANSWER", answer);
	    	if (answer != "Cancel") {
	    		for(var i in answer){
	    			$scope.append_step(pipeline, answer[i]);
	    		}
	    	}
	    }, function() {
	    });
	    
	    $event.stopPropagation();
	};
	
	$scope.samples_changed = function(experiment, text){
		console.log("SAMPLE_CHANGED", $scope, experiment, text);
		experiment.sample_ids = [];
		var rows = text.split("\n")
		for(var i in rows){
			experiment.sample_ids.push({
				"type": "run",
				"id": rows[i]
			});
		}
	};
	
	$scope.add_check = function(step){
		if(!step.checks) step.checks = [];
		step.checks.push(angular.copy(check_template));
	};
	
	$scope.delete_check = function(checks, check){
		if(!checks) return;
		checks.splice(checks.indexOf(check), 1);
	};
	
	$scope.add_variable = function(pipeline){
		pipeline.variables.push(angular.copy(variable_template));
	};
	
	$scope.delete_variable = function(pipeline, index){
		pipeline.variables.splice(index, 1);
	};
	
	
	$scope.remove_step = function(list, index){
		list.splice(index, 1);
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
	
//	$scope.select_step = function(index){
//		console.log("STEP SELECTED", index, $scope);
//		$scope.selected_step = $scope.selected_subproject.steps[index];
//	};
	
	$scope.transformChip = function(chip){
		if (angular.isObject(chip)) return chip;
  
		if(chip.indexOf("#") != -1){
			var values = chip.split("#");
			return { name: values[0], type: values[1] }
		}
		else return { name: chip, type: 'custom' }
	};
	
	$scope.searchTags = function(project, search){
		var tags = [];
		var met = [];
		
		for(var i in project.projects)
			for(var j in project.projects[i].experiments)
				for(var k in project.projects[i].experiments[j].dataset.tags)
				{
					var t = project.projects[i].experiments[j].dataset.tags[k];
					if(met.indexOf(t.name+"#"+t.type) == -1) tags.push(t)
					met.push(t.name+"#"+t.type);
					// if (tags.indexOf(t) == -1) tags.push(t)
					//tags = tags.concat(project.projects[i].experiments[j].dataset.tags)
				}
		
		console.log("AUTOCOMPLETE TAGS (ALL)", tags, project["title"]);
				
		var keys = {};
//		console.log(tags);
		tags = tags.filter(function(x){
			console.log("AUTOCOMPLETE TAGS FILTER", x);
			if(x.name.toLowerCase().indexOf(search.toLowerCase()) == -1 && x.type.toLowerCase().indexOf(search.toLowerCase()) == -1) return false;
			
			var k = x.name + "#" + x.type;
			
			var b = k in keys;
			if(b) return false;
			else keys[k] = 1;
			
			return true;
		}).sort(function(x, y){return x.type + "#" + x.name > y.type + "#" + y.name});
		console.log("AUTOCOMPLETE TAGS", search, tags);
		
		return tags;
	};
	
	$scope.chooseColor = function($event){
		$event.stopPropagation();
	};
	
	$scope.get_tags = function(data){
		var tags = [];
		var set = new Set();
		
		if (data.type == "experiment")
			tags = data.dataset.tags;
		
		else if (data.type == "bioproject")
			for(var j in data.experiments){
				var experiment = data.experiments[j]; 

				for(var k in experiment.dataset.tags){
					var tag = experiment.dataset.tags[k];
					if(!set.has(tag.type+"#"+tag.name)){
						set.add(tag.type+"#"+tag.name);
						tags.push(tag);
					}
				}
			}
				
		return tags;
	};
	
	$scope.get_compatible_pipeline = function(data){
		var compatiblePipeline = undefined;
		
		for(var i in $scope.selected_project.pipelines){
			var pipeline = $scope.selected_project.pipelines[i];
			
			var compatible = true;
			
			for(var j in pipeline.tags){
				var pTag = pipeline.tags[j];
				
				var tags = $scope.get_tags(data);
				
				var found = false;
				for(var k in tags) {
					var eTag = tags[k];
					
					if(eTag.type == pTag.type && eTag.name == pTag.name)
					{
						found = true;
						break;
					}
				}
				
				if(!found) {compatible = false; break;}
			}
			
			if(compatible) {
				compatiblePipeline = pipeline;
			}
		}
		
		return compatiblePipeline;
	}
	
	$scope.get_pipeline_style = function(subproject){
		var color = "#FFF";
		
		var compatiblePipeline = $scope.get_compatible_pipeline(subproject);
		
		if(compatiblePipeline != undefined){
//			subproject.dataset.pipeline = compatiblePipeline.id;
			color = compatiblePipeline.color;
		}
		
		return {
			"background-color": color
		};
	}
	
	$scope.produce_csv = function(project){
		apiService.download_csv(project, function(result){
			console.log("[DOWNLOAD CSV] AJAX RESULT", result);
			
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
			console.log("[DOWNLOAD CSV] AJAX RESULT ERROR", result);
			messageService.showMessage("Server error: " + result.status, "error");
		});
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
	
	$scope.update_monitor_data = function(project){
		console.log("ASKING MONITOR DATA OF", project);
		apiService.update_monitor_data(project, function(result){
			console.log("MONITOR RESULT", result);
			
			var data = result.data;
			
			$scope.monitor = {
				status: {
						id: "global",
						data: [],
						labels: [],
						colors: [],
						options: {
							legend: {
					            display: true,
					            position: "right"
							}
						}
				},
				elapsed: {
					data: [[]],
					labels: [],
					options: {
					},
					series: ["Elapsed"]
				},
				project_status: [],
				experiment_status: [],
				run_status: [],
			};
			
			for(var i in project.projects){
				var proj = project.projects[i];
				
				var project_stats = {
					id: proj.id,
					data: [],
					labels: [],
					colors: [],
					jobs: [],
					options: {
						responsive: false
					}
				};
				
				var closure = [];
				closure.push(proj.id);
				for(var j in proj.experiments){
					var exp = proj.experiments[j];
					closure.push(exp.id);
					
					var exp_stats = {
							id: exp.id,
							data: [],
							labels: [],
							colors: [],
							jobs: [],
							options: {
								responsive: false
							}
						};
					
					var exp_closure = [];
					exp_closure.push(exp.id);
					
					for(var k in exp.dataset.sample_ids){
						var run = exp.dataset.sample_ids[k];
						closure.push(run.id);
						exp_closure.push(run.id);
						
						var run_closure = [];
						run_closure.push(run.id);
						var run_stats = {
								id: run.id,
								data: [],
								labels: [],
								colors: [],
								jobs: [],
								options: {
									responsive: false
								}
							};
						
						var run_status = {};
						var run_counter = [];
						var run_jobs = {};
						for(var l in data){
							var job = data[l];
							if (run_closure.indexOf(job.BioentityID) !== -1){
								var s = job.State;
								if ( !(s.id in run_counter) ) run_counter[s.id] = 0;
								run_counter[s.id] += 1;
								run_status[s.id] = s;
								
								if (!(s.id in run_jobs) ) run_jobs[s.id] = [];
								run_jobs[s.id].push(job.JobName);	
							}
						}
						for(var s in run_counter){
							var st = run_status[s];
							var description = st.id;
							run_stats.labels.push(description);
							run_stats.data.push(run_counter[s]);
							run_stats.colors.push(st.color);
							run_stats.jobs.push(run_jobs[s]);
						}
						
//						console.log("RUN", run, run_closure, run_stats);
						
						$scope.monitor.run_status.push(run_stats);
					}
					
					var exp_status = {};
					var exp_counter = [];
					var exp_jobs = {};
					for(var l in data){
						var job = data[l];
						if (exp_closure.indexOf(job.BioentityID) !== -1){
							var s = job.State;
							if ( !(s.id in exp_counter) ) exp_counter[s.id] = 0;
							exp_counter[s.id] += 1;
							exp_status[s.id] = s;
							
							if (!(s.id in exp_jobs) ) exp_jobs[s.id] = [];
							exp_jobs[s.id].push(job.JobName);
						}
					}
					for(var s in exp_counter){
						var st = exp_status[s];
						var description = st.id;
						exp_stats.labels.push(description);
						exp_stats.data.push(exp_counter[s]);
						exp_stats.colors.push(st.color);
						exp_stats.jobs.push(exp_jobs[s]);
					}
					
//					console.log("EXP", exp, exp_closure, exp_stats);
					
					$scope.monitor.experiment_status.push(exp_stats);
				}
				
				var status = {};
				var counter = [];
				var prj_jobs = {};
				for(var l in data){
					var job = data[l];
					if (closure.indexOf(job.BioentityID) !== -1){
						var s = job.State;
						if ( !(s.id in counter) ) counter[s.id] = 0;
						counter[s.id] += 1;
						status[s.id] = s;
						
						if (!(s.id in prj_jobs) ) prj_jobs[s.id] = [];
						prj_jobs[s.id].push(job.JobName);
					}
				}
				for(var s in counter){
					var st = status[s];
					var description = st.id;
					project_stats.labels.push(description);
					project_stats.data.push(counter[s]);
					project_stats.colors.push(st.color);
					project_stats.jobs.push(prj_jobs[s]);
				}
				
//				console.log("PROJ", proj, closure, project_stats);
				
				$scope.monitor.project_status.push(project_stats);
			}
			
			var status = {};
			var counter = [];
			for(var i in data){
				var job = data[i];
				var s = job.State;
				if ( !(s.id in counter) ) counter[s.id] = 0;
				counter[s.id] += 1;
				status[s.id] = s;
			}
			for(var s in counter){
				var st = status[s];
				var description = st.id + " ("+st.description+")";
				$scope.monitor.status.labels.push(description);
				$scope.monitor.status.data.push(counter[s]);
				$scope.monitor.status.colors.push(st.color);
			}
			
			for (var i in data){
				var job = data[i];
				var name = job.JobName;
				var s = job.Elapsed;
				$scope.monitor.elapsed.labels.push(name);
				$scope.monitor.elapsed.data[0].push(moment.duration(s).seconds());
			}
			console.log($scope.monitor);
		});
	};
	
	$scope.refresh();
});