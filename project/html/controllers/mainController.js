app.controller('mainController', function($stateParams, $rootScope, $state, $routeParams, $scope, $window, $location, $filter, apiService, moment, messageService, Upload, $document, $timeout, $mdDialog, $mdSidenav, project){

	console.log("MAIN CONTROLLER", project, $state);
	$scope.project = project;

	// Utilities
	$scope.Object = Object;
	$scope.state = $state;
	$scope.checked_subproject = [];
//	$scope.color = "FF0000";
	
	
	$scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
	    if (toState.resolve) {
	        $scope.loading = true;
	    }
	});
	$scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
	    if (toState.resolve) {
	    	$scope.loading = false;
	    }
	});
	
	$scope.load_qos = function(username, cluster){
		console.log("LOADING QOS", username, cluster);
		
		$scope.queues = [];
		return apiService.get_qos(username, cluster, function(result){
			console.log("QOS", result);
			$scope.queues = result.data;
		});
	};
	
	$scope.get_account_url = function(pipeline){
		console.log("GET ACCOUNT URL", pipeline, $scope);
		return apiService.get_account_url(pipeline.username, pipeline.cluster);
	};
	
	$scope.get_module_url = function(pipeline){
		console.log("GET MODULE URL", pipeline, $scope);
		return apiService.get_module_url(pipeline.username, pipeline.cluster);
	};
	
// var condition_template = {
// "conditions": [],
// "condition": {},
// "op": ""
// };
//	
// var ops = ["OR", "AND", "NOT"];
	
	$scope.loading = false;
	
	$scope.init_filesystem_info = function(){
		
		$scope.connection_infos = [];
		var met = [];
		
		for(var i=0; i<$scope.project.pipelines.length; i++){
			var pipeline = $scope.project.pipelines[i];
			if(pipeline.username == "" || pipeline.remote_path == "") continue;
			
			var c = {
				username: pipeline.username,
				remote_path: pipeline.remote_path,
				cluster: pipeline.cluster,
				id: "Connection " + ($scope.connection_infos.length+1)
			};
			
			var id = c.username + "#" + c.remote_path + "#" + c.cluster;
			if (met.includes(id)) continue;
			met.push(id);
			$scope.connection_infos.push(c);
		}
		
		$scope.paths = [];
		for(var i=0; i<$scope.project.projects.length; i++){
			var bioproject = $scope.project.projects[i];
			
			$scope.paths.push({
				label: bioproject.id
			});
			
			for(var j=0; j<bioproject.experiments.length; j++){
				var experiment = bioproject.experiments[j];
				$scope.paths.push({
					label: bioproject.id + "/" + experiment.id
				});
				
				for(var k=0; k<experiment.dataset.sample_ids.length; k++){
					var run = experiment.dataset.sample_ids[k];
					$scope.paths.push({
						label: bioproject.id + "/" + experiment.id + "/" + run.id
					});
				}
			}
		}
		
		console.log("CONNECTION INFOS", $scope.connection_infos, $scope.paths);
	};
	
	
	$scope.prepare_graphs = function(){
		
		$scope.sizes = {
				data: [],
				labels: [],
				colors: [],
				options: {
					elements: {
				        arc: {
				            borderWidth: 0
				        }
				    },
					tooltips: {
			            callbacks: {
			                label: function(tooltipItem, data) {
			                	var description = data.labels[tooltipItem.index];
			                    var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
			                    
			                    var transformedValue = $filter('byteFormatter')(value);
			                    var allData = data.datasets[tooltipItem.datasetIndex].data;
								var total = 0;
								for (var i in allData) {total += parseFloat(allData[i]);}
								var fraction = (value / total) * 100;
								var percentage = fraction.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping:false})
			                    
								console.log("LABEL", tooltipItem, data, description, value, transformedValue);
			                    return description + ": " + transformedValue + " ("+percentage+"% of the total)";
			                }
			            }
			        }
				}
		};
		
		var sizes = [];
		for(var i=0; i<$scope.project.projects.length; i++){
			var bioproject = $scope.project.projects[i];
			if (bioproject.size != "N/A")
				sizes.push({size: bioproject.size, id: bioproject.id});
		}
		
		sizes.sort(function(a, b){return b.size - a.size});
		
		for(var i=0; i<sizes.length; i++){
			var size = sizes[i];
			$scope.sizes.data.push(size.size);
			$scope.sizes.labels.push(size.id);
		}
		
		console.log("SIZES", $scope.sizes);
	};
	
	
	
	$scope.fs = {};
	$scope.filesystem_api = function(fs){
		var op = "ls";
		
		if( !fs.results ) fs.loading = true;
		
		apiService.filesystem_api(fs, op,
				function(result){
				
				messageService.showMessages(result.data);
			
				for(var i=0; i<result.data.length; i++)
					if (result.data[i].type == "data")
					{
						if(fs.results == undefined) fs.results = result.data[i].message;
						else {
							fs.results.filters = result.data[i].message.filters;
							fs.results.options = result.data[i].message.options;
							fs.results.matches.length = 0;
							for(var x in result.data[i].message.matches)
								fs.results.matches.push(result.data[i].message.matches[x]);
						}
					}
				console.log("[FILESYSTEM API] AJAX RESULT", result, fs);
			}, function(result){
				console.log("[FILESYSTEM API] AJAX RESULT ERROR", result);
				messageService.showMessage("Server error: " + result.status, "error");
			}, function(){
				fs.loading = false;
			});
	};
	
	$scope.dataset_api = function(fs){
		if( !fs.results )
			fs.loading = true;
		
		var data_to_send = fs;
		
		data_to_send["projects"] = $scope.project.projects;
		
		apiService.dataset_api(data_to_send,
				function(result){
				
				if (result.data[0].message)
					fs.results = result.data[0].message;
				
				console.log("[DATASET API] AJAX RESULT", result, fs);
				
			}, function(result){
				console.log("[DATASET API] AJAX RESULT ERROR", result);
				messageService.showMessage("Server error: " + result.status, "error");
			}, function(){
				fs.loading = false;
			});
	};
	
	$scope.genome_choice = function(pipeline){
		console.log("GENOME CHOICE", pipeline.genome.type);
		if(pipeline.genome.type == "modules"){
			pipeline.genome.modules = [];
		}
	};
	
	$scope.get_layout = function(e){return e.type == "Layout" ? e.name : ""};
	
// var DynamicItems = function(elements) {
// this.elements = elements;
// };
// DynamicItems.prototype.getItemAtIndex = function(index) {
// return this.elements[index];
// };
// DynamicItems.prototype.getLength = function() {
// return this.elements.length;
// };
    
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
	
	$scope.toggleAll = function() {
		if ($scope.checked_subproject.length === $scope.project.projects.length) {
	      $scope.checked_subproject = [];
	    } else if ($scope.checked_subproject.length === 0 || $scope.checked_subproject.length > 0) {
	      $scope.checked_subproject = $scope.checked_subproject.concat($scope.project.projects.slice(0));
	    }
	};
	
	
	
	$scope.uploadDataset = function(files){
		console.log("UPLOADING DATASET");
		
		if (files && files.length) {
			$scope.file_sending = true;
			apiService.upload_dataset({project: Upload.json($scope.project), file: files}, function(resp){
				console.log('Success', resp);
				
				if(resp.data.message)
					messageService.showMessage(resp.data.message, "error");
				else {
					$scope.project = resp.data;
					$scope.prepare_graphs();
				}
				
			}, function(resp){
				console.log('Error status: ', resp);
			}, function(){
				$scope.file_sending = false;
			});
		}
	};
	
	$scope.uploadSamplesFromIdList = function($event){
		var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/IDlist_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		    	  return $scope.project;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("CREATE PROJECT DIALOG ANSWER", answer);
	    	if (answer != "Cancel" && answer != undefined) {
	    		$scope.file_sending = true;
	    		
	    		apiService.upload_from_ID_list({project: $scope.project, list: answer}, function(resp){
	    			console.log('Success', resp);
	    			
	    			if(resp.data.message)
						messageService.showMessage(resp.data.message, "error");
	    			else {
	    				// $scope.project = resp.data;
	    				$scope.project.projects.length = 0;
	    				for(var i=0; i<resp.data.projects.length; i++){
    						console.log("Adding bioproject", resp.data.projects[i]);
    						$scope.project.projects.push(resp.data.projects[i]);
	    				}
	    				$scope.prepare_graphs();
	    			}
	    		}, function(resp){
	    			console.log('Error status: ', resp);
	    		}, function(){
	    			$scope.file_sending = false;
	    		});
	    	}
	    }, function() {
	    });
	};
	
	$scope.downloadPhenodata = function($event){
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/make_choices_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		    	  var choices = [
		    		  {
		    			  title: "In the phenodata file that you are about to download, you would like to have:",
		    			  key: "choice",
		    			  type: "radio",
		    			  options: [
		    				  {key: "separate", label: "A sheet for each bioproject (useful in case you have few bioprojects)"}, 
		    				  {key: "joined", label: "A single sheet with all the bioprojects (useful in case you have many bioprojects)"}
	    				  ]
		    		  }];
		    	  console.log("[DIALOG MAKE CHOICE]", choices);
		        return choices;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("DIALOG ANSWER", answer);
	    	
	    	if (answer != undefined)
	    		$scope.downloadFrom(apiService.download_phenodata, {project: $scope.project, options: answer});
	    }, function() {
	    });
	    
	    $event.stopPropagation();
	};
	
	$scope.downloadDataset = function(){
		$scope.downloadFrom(apiService.download_dataset, $scope.project);
	};
	
	$scope.downloadProject = function(){
		apiService.download_project($scope.project,
				function(result){
					console.log("[DOWNLOAD PROJECT] AJAX RESULT", result);
					
					var url = result.data.url;
					var filename = result.data.filename;
					
					var downloadLink = angular.element('<a target="_self"></a>');
		            downloadLink.attr('href', url);
		            downloadLink.attr('download', filename);
		            
		            console.log(downloadLink, url, filename);
		            
		            var body = $document.find('body').eq(0);
		            body.append(downloadLink)
		            
					downloadLink[0].click();
				},
				function(error){},
				function(){});
	};
	
	$scope.downloadFrom = function(fx, data){
		fx(data, function(result){
			console.log("[DOWNLOAD] AJAX RESULT", result);
			
			var filename = "download.xlsx";
			var info = result.headers('Content-Disposition');
			var fields = info.split("; ");
			for(var i=0; i<fields.length; i++){
				var field = fields[i];
				console.log(field);
				if (field.indexOf("filename=") == 0){
					filename = field.replace("filename=", "")
					break;
				}
			}

			var blob = new Blob([result.data], {
		        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		    });
			
			var url = URL.createObjectURL(blob);
			
			var downloadLink = angular.element('<a target="_self"></a>');
            downloadLink.attr('href', url);
            downloadLink.attr('download', filename);
            console.log("DOWNLOAD", downloadLink, url, filename);
            var body = $document.find('body').eq(0);
            body.append(downloadLink)
			downloadLink[0].click();
            
		}, function(result){
			console.log("[DOWNLOAD] AJAX RESULT ERROR", result);
			messageService.showMessage("Server error: " + result.status, "error");
		});
	};
	
	$scope.uploadPhenodata = function(files){
		if (files && files.length) {
			$scope.file_uploading = true;
			apiService.upload_phenodata($scope.project.id, files,
				function(resp){
					console.log('Success', resp);
				},
				function(resp){
					console.log('Error status: ', resp);
				},
				function(){
					$scope.file_uploading = false;
				});
		}
	};
	
	$scope.add_papers = function(bioproject, files){
		if (files && files.length) {
			$scope.file_uploading = true;
			apiService.add_papers($scope.project, bioproject.id, files, function(resp){
				console.log('Success', resp);
				
				angular.forEach(resp.data, function(paper){
					if(!bioproject.papers) bioproject.papers = [];
					bioproject.papers.push(paper);
				});						
				
			}, function(resp){
				console.log('Error status: ', resp);
			}, function(){
				$scope.file_uploading = false;
			});
		}
	};
	
	$scope.delete_paper = function(list, index, $event){
		$scope.showDeleteDialog(list, index, $event, function(list, index){
			console.log("REMOVING PAPER", list, index);
			
			apiService.delete_paper($scope.project.id, list[index].name, function(result){
				console.log("[DELETE PAPER] AJAX RESULT", result);
				messageService.showMessage(result.data.message, result.data.type);
				
				if(result.data.type == "info")
					$scope.delete_from_array(list, index);
				
			}, function(result){
				console.log("[DELETE PAPER] AJAX RESULT ERROR", result);
				messageService.showMessage("Server error: " + result.status, "error");
			});
			
			return true;
		});
	};
	
	$scope.uploadFiles = function(files){
		if (files && files.length) {
			
			console.log("Uploading file...", files);
			$scope.file_uploading = true;
			apiService.upload_data($scope.project.id, files,
				function(resp){
					console.log('Success', resp);
					
					messageService.showMessages(resp.data);

					for(var i in resp.data)
						if (resp.data[i].type == "data")
						{
							if($scope.project.files == undefined)
								$scope.project.files = [];

							$scope.project.files.push(resp.data[i].message);
						}
				},
				function(resp){
					console.log('Error status: ', resp);
					messageService.showMessages(resp.data);
				},
				function(){
					$scope.file_uploading = false;
				});
		}
	};
	
	$scope.removeFile = function(index){
		var file = $scope.project.files[index];
		
		console.log("REMOVING FILE", file, index, $scope.project.files);
		
		apiService.remove_data($scope.project.id, file,
			function(resp){
				console.log('Success', resp);
				messageService.showMessages(resp.data);
				
				$scope.delete_from_array($scope.project.files, index);
			},
			function(resp){
				console.log('Error status: ', resp);
				messageService.showMessages(resp.data);
			},
			function(){
			});
	};
	
	$scope.add_empty_subproject = function(){
		console.log("[ADD EMPTY SUBPROJECT]", $scope.project, $rootScope.templates.subproject);
		$rootScope.add_to_list(angular.copy($rootScope.templates.subproject), $scope.project.projects);
	};
	
	$scope.add_subproject = function(subproject){
		console.log("[ADD SUBPROJECT]", $scope.project, subproject);
		$rootScope.add_to_list(subproject, $scope.project.projects);
	};
	
	$scope.add_empty_experiment = function(subproject){
		console.log("[ADD EMPTY SUBPROJECT]", subproject, $rootScope.templates.experiment);
		$rootScope.add_to_list(angular.copy($rootScope.templates.experiment), subproject.experiments);
	};
	
	$scope.add_empty_run = function(experiment){
		console.log("[ADD EMPTY SUBPROJECT]", experiment, $rootScope.templates.run);
		$rootScope.add_to_list(angular.copy($rootScope.templates.run), experiment.dataset.run_ids);
	};
	
	$scope.add_experiment = function(experiment){
		console.log("[ADD EXPERIMENT]", $scope.project, experiment);
		$rootScope.add_to_list(experiment, $scope.project.experiments);
	};
	
	$scope.add_launch = function(){
		console.log("[CREATE LAUNCH]", $scope.project, $rootScope.templates.launch);
		if($scope.project.launches == undefined) $scope.project.launches = [];
		var copy = angular.copy($rootScope.templates.launch);
		
		copy.id = "Launch " + ($scope.project.launches.length + 1)
		copy.title = $scope.project.id;
		copy.subtitle = $scope.project.subtitle;
		copy.description = $scope.project.description;
		copy.creation_date = moment().format('YYYY-MM-DD HH:mm:ss');
		copy.pipelines = angular.copy($scope.project.pipelines);
		$scope.project.launches.push(copy);
	};
	
	$scope.set_launch_pipelines = function(launch, pipelines){
		console.log("SETTING PIPELINES OF LAUNCH");
		launch.pipelines.splice(0, launch.pipelines.length);
		
		for(var i=0; i<pipelines.length; i++){
			launch.pipelines.push(angular.copy(pipelines[i]));
		}
	};
	
//	$scope.create_monitor_pipeline = function(){
//		console.log("[CREATE MONITOR PIPELINE]", $scope.project, $rootScope.templates.pipeline);
//		if($scope.project.monitor_pipelines == undefined)
//			$scope.project.monitor_pipelines = [];
//		$scope.project.monitor_pipelines.push(angular.copy($rootScope.templates.pipeline));
//	};
	
	$scope.delete_subprojects = function(){
		console.log("[DELETE SUBPROJECTs]", $scope.project);
		for(var i in $scope.checked_subproject)
		{
			var subproject = $scope.checked_subproject[i];
			var index = $scope.project.projects.indexOf(subproject);
			$scope.delete_from_array($scope.project.projects, index);
		}
		
		$scope.checked_subproject = [];
	};
	
	$scope.add_log_event = function(log_event){
		if ($scope.project.logs == undefined)
			$scope.project.logs = [];
		
		$scope.project.logs.push(log_event);
	};
	
//	$scope.add_log_event({
//		type: "pipeline_event",
//		title: "Step added",
//		status: "success",
//		timestamp: moment(),
//		content: "A new step has been added to the pipeline: <b>" + step.title + "</b>"
//	});
	
// $scope.samples_changed = function(experiment, text){
// console.log("SAMPLE_CHANGED", $scope, experiment, text);
// experiment.sample_ids = [];
// var rows = text.split("\n")
// for(var i in rows){
// experiment.sample_ids.push({
// "type": "run",
// "id": rows[i]
// });
// }
// };
	
//	$scope.refresh_monitor_step = function(pipeline, step){
//		
//		var inverted_index = {};
//		for(var i=0; i<$scope.project.projects.length; i++){
//			var bioproject = $scope.project.projects[i];
//			inverted_index[bioproject.id] = $scope.project;
//			
//			for(var j=0; j<bioproject.experiments.length; j++){
//				var experiment = bioproject.experiments[j];
//				inverted_index[experiment.id] = bioproject;
//				
//				for(var k=0; k<experiment.dataset.sample_ids.length; k++){
//					var run = experiment.dataset.sample_ids[k];
//					inverted_index[run.id] = experiment;
//				}
//			}
//		}
//		
//		apiService.get_monitor_step_data($scope.project, pipeline, step, function(result){
//			  console.log("MONITOR STEP RESULT", result, step, pipeline);
//			  
//			  $scope.select_data("step", step);
//			  
//			  for(var i=0; i<result.data.length; i++){
//				  var message = result.data[i];
//				  messageService.showMessage(message.message, message.type);
//				  
//				  // Server has sent real data
//				  if (message.data){
//					  var remainder = {};
//					  for(var j=0; j<message.data.data.length; j++){
//						  var d = message.data.data[j];
//						  remainder[d.id] = {
//								  id: d.id,
//								  data: {},
//								  graphs: {},
//								  aggregated: {
//									  status: {
//										  counter: {},
//										  data: {}
//									  }
//								  }
//						  };
//						  remainder[d.id].data[d.id] = d;
//						  remainder[d.id].aggregated.status.counter[d.status] = 1;
//						  remainder[d.id].aggregated.status.data[d.status] = [d];
//						  
//						  for(var k=0; k<d.data.length; k++)
//							  for(var key in d.data[k]){
//								  var f = d.data[k][key];
//								  var n = Number(f);
//								  if(isNaN(n)) {
//									  remainder[d.id].aggregated[key] = {counter: {}, data: {}};
//									  remainder[d.id].aggregated[key].counter[f] = 1;
//									  remainder[d.id].aggregated[key].data[f] = [d];
//								  }
//								  else remainder[d.id].aggregated[key] = n;
//							  }
//						  
//						  for(var key in remainder[d.id].aggregated)
//						  {
//							  if(!isNaN(remainder[d.id].aggregated[key])) {
//								  remainder[d.id].graphs[key] = remainder[d.id].aggregated[key];
//							  }
//							  else {
//								  remainder[d.id].graphs[key] = $scope.create_graph(key, remainder[d.id].aggregated[key]);
//							  }
//						  }
//					  }
//					  
//					  var levels = ["top", "project", "experiment", "sample"];
//					  var loops = levels.indexOf(step.command_level);
//					  
//					  for(var l=0;l<loops;l++){
//						  var nextRemainder = {}
//						  
//						  for (var key in remainder) {
//							  var d = remainder[key];
//							  var upper = inverted_index[key];
//							  
//							  if (!(upper.id in nextRemainder)){
//								  nextRemainder[upper.id] = {
//									  id: upper.id,
//									  data: {},
//									  graphs: {},
//									  aggregated: {}
//								  };
//							  }
//							  
//							  var upperRemainder = nextRemainder[upper.id];
//							  
//							  // Save the data in the upper level
//							  upperRemainder.data[key] = d;
//							  
//							  // Aggregate results
//							  for(var aggregateKey in d.aggregated){
//								  // e.g., aggregateKey = "status"
//								  var current = d.aggregated[aggregateKey];
//
//								  // current can be a distribution or a single
//									// value
//								  if(!isNaN(Number(current))){
//									  if (!(aggregateKey in upperRemainder.aggregated))
//										  upperRemainder.aggregated[aggregateKey] = 0;
//									  upperRemainder.aggregated[aggregateKey] += current;
//								  }
//								  else {
//									  if (!(aggregateKey in upperRemainder.aggregated))
//										  upperRemainder.aggregated[aggregateKey] = {counter: {}, data: {}};
//									  var previous = upperRemainder.aggregated[aggregateKey];
//								  
//									  // e.g., aggregateName = "OK"
//									  for(var aggregateName in current.counter){
//										  if(!(aggregateName in previous.counter))
//											  previous.counter[aggregateName] = 0;
//										  
//										  previous.counter[aggregateName] += current.counter[aggregateName];
//										  for(var m=0; m<current.data[aggregateName].length; m++){
//											  if(!(aggregateName in previous.data))
//												  previous.data[aggregateName] = [];
//											  previous.data[aggregateName].push(current.data[aggregateName][m]);
//										  }
//									  }
//								  }
//							  }
//						  }
//						  
//						  for(var id in nextRemainder)
//							  for(var key in nextRemainder[id].aggregated){
//								  if (!isNaN(nextRemainder[id].aggregated[key])) {
//									  nextRemainder[id].graphs[key] = nextRemainder[id].aggregated[key];
//								  }
//								  else {
//									  nextRemainder[id].graphs[key] = $scope.create_graph(key, nextRemainder[id].aggregated[key]);
//								  }
//							  }
//						  
//						  remainder = nextRemainder;
//					  }
//					  
//					  step.info = remainder;
//					  
//					  console.log("MONITOR STEP RESULT [FINISHED]", step.info);
//					  
//// for(var key in message.data.counters){
//// var counter = message.data.counters[key];
//// console.log("STEP RES", counter);
//// var graph = $scope.create_graph(key, counter);
//// step.monitor_data.push(graph);
//// }
//				  }
//			  }
//		  });
//	};
	
//	$scope.onMonitorClick = function(points, event){
//		console.log("ONCLICK", points, event, $scope);
//		for(var k=0; k<points.length; k++){
//			var point = points[k];
//			var chart = point._chart.controller;
//			
//			var label = chart.data.labels[point._index];
//	        var value = chart.data.datasets[point._datasetIndex].data[point._index];
//			console.log("ONCLICK", chart, point, label, value);
//			
//			$scope.select_data("details", {});
//			
//			for(var i=0; i<label.data.length; i++){
//				var d = label.data[i];
//				$scope.selected_data["details"][d.id] = d;
//			}
//			
//			console.log("ONCLICK WITH DATA", chart, point, label, value, $scope.selected_data);
//			
//			$scope.select_monitor_tab(6);
//		}
//	};
	
	$scope.save = function(fx){
		$scope.disabled = true;
		apiService.save_project($scope.project,
			function(result){
				console.log("[SAVE PROJECT] AJAX RESULT", result);
				messageService.showMessages(result.data);
				
				if(fx != undefined){
					fx();
				}
			}, function(result){
				console.log("[SAVE PROJECT] AJAX RESULT ERROR", result);
				messageService.showMessage("Server error: " + result.status, "error");
			}, function(){$scope.disabled = false;});
	};
	
	$scope.see_table = function(bioproject_id, ev) {
		
		apiService.get_phenodata($scope.project.id, bioproject_id, function(result){
			console.log("PHENODATA", result);
			
			var table = result.data;
			
			console.log("PHENOTIPIC TABLE", table);
			  
		    $mdDialog.show({
		    	controller: DialogController,
			      templateUrl: 'templates/dialogs/table_dialog.html',
			      parent: angular.element(document.body),
			      targetEvent: ev,
				  fullscreen: $scope.customFullscreen,
			      clickOutsideToClose:true,
			      resolve: {
						item: function(){
							return table;
						}
					}
		    })
		    .then(function(answer) {
		    }, function() {
		    });
		}, function(error){
			console.log("[LOAD PHENODATA] AJAX RESULT ERROR", error);
			messageService.showMessage("Server error: " + error.status, "error");
		});
	};
	
	$scope.getTags = function(){
		
		var stoptags = ["type", "bioproject", "experiment", "run"];
		var tags = [];
		var met = [];
		
		for(var i in $scope.project.projects)
			for(var j in $scope.project.projects[i].experiments){
				for(var k in $scope.project.projects[i].experiments[j].tags)
				{
					var t = $scope.project.projects[i].experiments[j].tags[k];
					if(stoptags.includes(t.type)) continue;
					
					if(met.indexOf(t.name+"#"+t.type) == -1) tags.push(t)
					met.push(t.name+"#"+t.type);
					
					if(met.indexOf(t.type) == -1) tags.push({name: undefined, type: t.type})
					met.push(t.type);
				}
			}
		
		tags.push({type: "bioproject", name: ""});
		tags.push({type: "experiment", name: ""});
		tags.push({type: "run", name: ""});
		
		return tags;
	};
	
	$scope.getTagsTypes = function(){
		var tags = $scope.getTags();
		
		var met = {};
		for(var i=0; i<tags.length; i++){
			var tag = tags[i];
			if(tag.name == undefined) continue;
			
			if (!(tag.type in met))
				met[tag.type] = {type: tag.type, name: "", columns: [], names: []};

			var found = undefined;
			for(var j=0; j<met[tag.type].names.length; j++){
				var name = met[tag.type].names[j];
				if (name.name == tag.name){
					found = name;
					break;
				}
			}
			if(found) continue;
			met[tag.type].names.push({name: tag.name, columns: {}});
			continue;
			
		}
		
		var tagTypes = [];
		for(var i in met){
			tagTypes.push(met[i]);
		}
		console.log("TAG TYPES:", tagTypes, tags);
		
		return tagTypes;
	};
	
	$scope.chooseColor = function($event){
		$event.stopPropagation();
	};
	
	$scope.get_compatible_pipelines = function(data){
		var compatiblePipelines = [];
		
		for(var i in $scope.project.pipelines){
			var pipeline = $scope.project.pipelines[i];
			
			var compatible = true;
			
			// Divide the tags into categories, based on their type
			var types2values = {};
			for(var i in pipeline.tags){
				var tag = pipeline.tags[i];
				if (!(tag.type in types2values))
					types2values[tag.type] = [];
				
				types2values[tag.type].push(tag.name);
			};
			
			var dataTypes2values = {};
			var dataTags = data.tags;
			for(var i in dataTags){
				var tag = dataTags[i];
				if (!(tag.type in dataTypes2values))
					dataTypes2values[tag.type] = [];
				
				dataTypes2values[tag.type].push(tag.name);
			};
			
			// For each type
			for(var type in dataTypes2values){
				
				if(!(type in types2values)) continue;

				// We have to check for each tag of that type and see if it is
				// contained
				var pValues = new Set(types2values[type]);
				var values = new Set(dataTypes2values[type]);
				
				var intersection = new Set(Array.from(values).filter(x => pValues.has(x)));
				
				if(intersection.size != values.size) {
					compatible = false;
					break;
				}
			};
			
			if(compatible)
				compatiblePipelines.push(pipeline);
		}
		
		return compatiblePipelines;
	};
	
	$scope.get_pipeline_style = function(subproject){
		var color = undefined;
		
		var compatiblePipelines = $scope.get_compatible_pipelines(subproject);
		
		if(compatiblePipelines.length == 0) color = "#FFFFFF";
		else if(compatiblePipelines.length == 1) color = compatiblePipelines[0].color;
		else if(compatiblePipelines.length > 0) color = "#505050";
		
		subproject.pipelines = compatiblePipelines;
		
		return {
			"background-color": color
		};
	}
	
	$scope.launch_scripts = function(launch){
		var step = 1;
		
		$scope.launch_disabled = true;
		
		var okFx = function(result){
			console.log("[LAUNCH SCRIPTS] AJAX RESULT", result);
			angular.forEach(result.data, function(m){
				if (m.type != "data")
					messageService.showMessage(m.message, m.type, undefined, 5000);
				else {
					if ($scope.project.runs == undefined) $scope.project.runs = [];
					$scope.project.runs.push(m.message);
				}
			})};
		
		var errorFx = function(result){
			console.log("[LAUNCH SCRIPTS] AJAX RESULT ERROR", result);
			messageService.showMessages(result.data);
		};
		
		apiService.launch_scripts($scope.project, launch, step,
				function(result){okFx(result); apiService.launch_scripts($scope.project, launch, step+1, 
						function(result){okFx(result); apiService.launch_scripts($scope.project, $scope.project.runs[$scope.project.runs.length-1], step+2,
								function(result){okFx(result); apiService.launch_scripts($scope.project, $scope.project.runs[$scope.project.runs.length-1], step+3,
										function(result){okFx(result); apiService.launch_scripts($scope.project, $scope.project.runs[$scope.project.runs.length-1], step+4,
												function(result){okFx(result);},
												errorFx);},
										errorFx);},
								errorFx);},
						errorFx);},
				errorFx, function(){$scope.launch_disabled = false;});
	};
	
	$scope.launch_monitor_scripts = function(){
		apiService.launch_monitor_scripts($scope.project, function(result){
			console.log("[LAUNCH MONITOR SCRIPTS] AJAX RESULT", result);
			angular.forEach(result.data, function(m){
				messageService.showMessage(m.message, m.type, undefined, 5000);
			});
		}, function(result){
			console.log("[LAUNCH MONITOR SCRIPTS] AJAX RESULT ERROR", result);
			messageService.showMessage("Server error: " + result.status, "error", undefined, 5000);
		});
	};
	
	$scope.download_scripts = function(launch){
		apiService.download_scripts($scope.project, launch, function(result){
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
	
	console.log("STATE", $state, $state.current.name);
	
	$scope.prepare_graphs();
});