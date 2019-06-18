app.controller('pipelineController', function($scope, userService, $state, $window, $location, $filter, apiService, moment, messageService, $document, $timeout, $mdDialog, $mdSidenav){
	
	$scope.state = $state;
	
	$scope.add_variable = function(pipeline){
		pipeline.variables.push(angular.copy($rootScope.templates.variable));
	};
	
	$scope.delete_variable = function(pipeline, index){
		$scope.delete_from_array(pipeline.variables, index);
	};
	
	$scope.remove_pipeline = function(list, index, $event){
		$scope.showDeleteDialog(list, index, $event, function(list, index){
			console.log("REMOVING PIPELINE", list, index);
			
			if(list[index].id == "")
				$scope.delete_from_array(list, index);
			else {
				if($scope.project == undefined){
					if($state.current.name == "pipeline_repository") {
						apiService.delete_pipeline_from_repository(list[index], function(result){
							messageService.showMessages(result.data);
							$scope.delete_from_array(list, index);
						}, function(error){
							console.log(error);
							messageService.showMessages(error.data);
						}, function(){});
					}
				}
				else {
					apiService.delete_pipeline($scope.project.id, list[index].id, function(result){
						console.log("[DELETE PIPELINE] AJAX RESULT", result);
						messageService.showMessage(result.data.message, result.data.type);
						
						if(result.data.type == "info")
							$scope.delete_from_array(list, index);
						
					}, function(result){
						console.log("[DELETE PIPELINE] AJAX RESULT ERROR", result);
						messageService.showMessage("Server error: " + result.status, "error");
					});
				}
			}
		});
	};
	
	$scope.create_graph = function(key, info, type){
		
		var monitor_single_data = {
		  title: key,
		  data: [],
		  labels: []
		};
		
		if(type=="chart-bar")
			monitor_single_data.options = {
			  scales: {
			        yAxes: [{
			            display: true,
			            ticks: {
			                suggestedMin: 0,    // minimum will
												// be 0, unless
												// there is a
												// lower value.
			            }
			        }]
			    }
		  };
		
		monitor_single_data.options = {
				tooltips: {
		            callbacks: {
		                label: function(tooltipItem, data) {
		                	var description = data.labels[tooltipItem.index];
		                    var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
		                    
		                    console.log("LABEL", tooltipItem, data, description, value);
		                    
		                    return description.id + ":" + value;
		                }
		            }
		        }
		};
		  
		for(var id in info.counter){
			monitor_single_data.labels.push({"key": key, "id": id, "data": info.data[id]});
			monitor_single_data.data.push(info.counter[id]);
		}
		  
		return monitor_single_data;
	};
	
	$scope.select_pipeline = function(item, list, id, pane){
		var pipeline = list[item];
		console.log("SELECTING PIPELINE", pipeline,  $scope, id, pane);
		$scope.module_url = apiService.get_module_url(pipeline.username, pipeline.cluster);
	};
	
	$scope.create_new_pipeline = function(id){
		console.log("[CREATE PIPELINE]", $scope.templates.pipeline);
		var pipeline = angular.copy($scope.templates.pipeline);
		pipeline.id = id;
		return pipeline;
	};
	
	$scope.add_pipeline = function(list, pipeline){
		$scope.add_to_list(pipeline, list);
	};
	
	$scope.import_pipeline = function(list, $event){
		apiService.get_pipelines(function(resp){
			console.log("GET PIPELINES", resp);
			
			var confirm = {
		    	controller: DialogController,
				templateUrl: 'templates/dialogs/import_pipeline_dialog.html',
				parent: angular.element(document.body),
				targetEvent: $event,
				clickOutsideToClose:true,
				fullscreen: $scope.customFullscreen,
				resolve: {
			      item: function () {
			    	  return resp.data;
			      }
			    }
		    };
			
			
		    $mdDialog.show(confirm).then(function(answer) {
		    	console.log("DIALOG IMPORT PIPELINE ANSWER", answer);
		    	if (answer != "Cancel") {
		    		
		    		apiService.import_pipelines($scope.project, answer, function(result){
						console.log("[IMPORT PIPELINE] AJAX RESULT", result);
						
						messageService.showMessage(result.data.message, result.data.type);
						
						if(result.data.type == "info")
							for(var i in answer)
				    			list.push(answer[i]);
						
					}, function(result){
						console.log("[IMPORT PIPELINE] AJAX RESULT ERROR", result);
						messageService.showMessage("Server error: " + result.status, "error");
					});
		    	}
		    }, function() {});
		}, function(resp){
			messageService.showMessage(resp, "warn");
			console.log('Error', resp);
		});
	};
	
	$scope.showRenamePipelineDialog = function(pipeline, index, $event) {
		console.log(pipeline);
		
	    var confirm = {
	    	controller: DialogController,
			templateUrl: 'templates/dialogs/rename_pipeline_dialog.html',
			parent: angular.element(document.body),
			targetEvent: $event,
			clickOutsideToClose:true,
			fullscreen: $scope.customFullscreen,
			resolve: {
		      item: function () {
		        return pipeline;
		      }
		    }
	    };

	    $mdDialog.show(confirm).then(function(answer) {
	    	console.log("RENAME DIALOG ANSWER", answer);
	    	
	    	if (answer != undefined && answer != "Cancel") {
	    		console.log("NEW NAME", answer);
	    		
	    		if($scope.project == undefined) {
					apiService.rename_pipeline_in_repository(pipeline.id, answer, function(result){
						messageService.showMessages(result.data);
						pipeline.id = answer;
					}, function(error){
						console.log(error);
						messageService.showMessages(error.data);
					}, function(){});
				}
				else {
		    		apiService.rename_pipeline($scope.project.id, pipeline.id, answer, function(result){
		    			pipeline.id = answer;
		    			console.log("RENAME PIPELINE OK", pipeline, result);
		    			messageService.showMessage(result.data.message, result.data.type);
		    			
		    		}, function(result){
		    			console.log("[RENAME PIPELINE] AJAX RESULT ERROR", result);
		    			messageService.showMessage("Server error: " + result.status, "error");
		    		});
				}
	    	}
	    }, function() {});
	    
	    $event.stopPropagation();
	};
	
	$scope.queue_changed = function(pipeline, queue){
		console.log("CHANGED QUEUE", pipeline, queue);
		angular.forEach(pipeline.steps, function(step){
			step.hpc_directives.queue = queue;
		});
	};
	
	$scope.select_account = function(pipeline, accountItem){
		pipeline.account = accountItem.label;
		console.log("SELECTED ACCOUNT: ", accountItem);
		angular.forEach(pipeline.steps, function(step){
			step.hpc_directives.account = accountItem.label;
		});
	};
	
	$scope.delete_column = function(tagType, index, ev){
		var confirm = $mdDialog.confirm()
	        .title('Would you like to delete this column?')
	        .textContent('You wish to delete the column ' + tagType.columns[index])
	        .ariaLabel('Delete column')
	        .targetEvent(ev)
	        .ok('Yes')
	        .cancel('No');
	
	  $mdDialog.show(confirm).then(function() {
		  var colName = tagType.columns[index];
		  tagType.columns.splice(index, 1);
		  for(var i=0; i<tagType.names.length; i++)
			  delete tagType.names[i].columns[colName];
		  
	  }, function() {
	  });
	};
	
	$scope.add_column = function(tagType, ev){
		var confirm = $mdDialog.prompt()
	      .title('What type of information you wish to add?')
	      .textContent('Type here the type of information you wish to add to each tag')
	      .placeholder('Type')
	      .ariaLabel('Information type')
	      .initialValue('GENOME')
	      .targetEvent(ev)
	      .required(true)
	      .ok('Add column')
	      .cancel('Cancel');

	    $mdDialog.show(confirm).then(function(colName) {
    		tagType.columns.push(colName);
    		for(var i=0; i<tagType.names.length; i++)
    			tagType.names[i].columns[colName] = "";
	    }, function() {
	    });
	}
	
	$scope.uploadPipelineFiles = function(pipeline, files){
		if (files && files.length) {
			$scope.file_uploading = true;
			
			console.log("UPLOADING PIPELINE SCRIPTS", $scope.project.id, pipeline, files);
			
			apiService.upload_pipeline_files($scope.project.id, pipeline.id, files,
				function(resp){
					console.log('Success', resp);
					messageService.showMessages(resp.data);
					
					for(var i in resp.data)
						if (resp.data[i].type == "data")
						{
							if(pipeline.files == undefined)
								pipeline.files = [];

							pipeline.files.push(resp.data[i].message);
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
	
	$scope.removePipelineFile = function(pipeline, index){
		var file = pipeline.files[index];
		
		console.log("REMOVING FILE", file, index, pipeline.files);
		
		apiService.remove_pipeline_data($scope.projectid, pipeline.id, file,
			function(resp){
				console.log('Success', resp);
				messageService.showMessages(resp.data);				
				
				$scope.delete_from_array(pipeline.files, index);
			},
			function(resp){
				console.log('Error status: ', resp);
				messageService.showMessages(resp.data);
			},
			function(){
			});
	};
	
	$scope.savePipelineToRepository = function(pipeline, event){
		console.log("SAVING PIPELINE", pipeline);
		
		apiService.save_pipeline_to_repository(pipeline, false, function(resp){
			console.log(resp);
			var message = resp.data.message;
			messageService.showMessage(message, resp.data.type);
			
			if(resp.data.type == "error"){
				var confirm = $mdDialog.confirm()
		          .title('Message from server')
		          .textContent(message + "\n" + "Would you like to overwrite the existing pipeline "+pipeline.id+"?")
		          .targetEvent(event)
		          .ok('OK')
		          .cancel('Cancel');

			    $mdDialog.show(confirm).then(function() {
			    	console.log("You want to overwrite the pipeline");
			    	apiService.save_pipeline_to_repository(pipeline, true, function(resp){
			    		messageService.showMessage("Pipeline "+pipeline.id+" has been overwritten", "info");
			    		
			    	}, function(resp) {
			    		messageService.showMessage("Pipeline "+pipeline.id+" has not been overwritten", "info");
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
	
	$scope.saveMonitorPipelineToRepository = function(pipeline, event){
		console.log("SAVING MONITOR PIPELINE", pipeline);
		
		apiService.save_monitor_pipeline_to_repository(pipeline, false, function(resp){
			console.log(resp);
			var message = resp.data.message;
			messageService.showMessage(message, resp.data.type);
			
			if(resp.data.type == "error"){
				var confirm = $mdDialog.confirm()
		          .title('Message from server')
		          .textContent(message + "\n" + "Would you like to overwrite the existing monitor pipeline "+pipeline.id+"?")
		          .targetEvent(event)
		          .ok('OK')
		          .cancel('Cancel');

			    $mdDialog.show(confirm).then(function() {
			    	console.log("You want to overwrite the pipeline");
			    	apiService.save_monitor_pipeline_to_repository(pipeline, true, function(resp){
			    		messageService.showMessage("Monitor pipeline "+pipeline.id+" has been overwritten", "info");
			    		
			    	}, function(resp) {
			    		messageService.showMessage("Monitor pipeline "+pipeline.id+" has not been overwritten", "info");
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
	
	$scope.build_graph = function(pipeline, index, options, element){
		
		console.log("BUILDING GRAPH FOR PIPELINE", pipeline, index, options, element);
		
		if(options == undefined){
			$scope.options = {
					show_colors: true,
					show_skipped_steps: true,
					show_resources: true
			};
			options = $scope.options;
		}
		
		options.graph_shown = true;
		
		console.log("BUILDING GRAPH FOR PIPELINE REAL", pipeline, index, options);
		
		// Create the input graph
		var g = new dagreD3.graphlib.Graph()
		  .setGraph({ranksep: 20})
		  .setDefaultEdgeLabel(function() { return {}; });
		
		// Here we"re setting nodeclass, which is used by our custom drawNodes
		// function
		// below.
		var stepname2id = {};
		var name2step = {};
// var done = 0;
		for(var i=0; i<pipeline.steps.length; i++){
			var step = pipeline.steps[i];
			name2step[step.title] = step;
			
			if(options.show_skipped_steps === false && step.skip === true) continue;
			
			var label = "<b title='"+step.commandline+"'>"+step.title+"</b>" + (step.skip ? "<span> (skipped)</span>" : "");
			
			if (options.show_resources){
				label = "<div>" +
							label +
							"<div>" +
								"<span title='CPUs: "+step.hpc_directives.cpu+"'><i class='fas fa-microchip' style='color: red'></i>"+step.hpc_directives.cpu+"</span>" +
								"<span class='margin-left-5' title='RAM: "+step.hpc_directives.memory.quantity + step.hpc_directives.memory.size +"'><i class='fas fa-memory' style='color: darkgreen'></i>"+step.hpc_directives.memory.quantity + step.hpc_directives.memory.size+"</span>" +
								"<span class='margin-left-5' title='Walltime: "+step.hpc_directives.walltime+"'><i class='fas fa-clock' style='color: blue'></i>"+step.hpc_directives.walltime+"</span>" +
							"</div>" +
						"</div>";
			}
			
		    var nodeOptions = {
					label: label,
					labelType: "html",
					rx: 5,
					ry: 5
				};
			
			if(options.show_colors)
				nodeOptions.class = step.script_level;
			
			g.setNode(i, nodeOptions);
			stepname2id[step.title] = i;
// done += 1;
		}

		// Set up edges, no special attributes.
		for(var i=0; i<pipeline.steps.length; i++){
			var step = pipeline.steps[i];
			if(options.show_skipped_steps === false && step.skip === true) continue;
			
			var fromNode = stepname2id[step.title];
			
			var dependencies = [];
			
			var currentDependencies = step.hpc_directives.dependencies.slice(0);
// console.log(step.title, currentDependencies);
			while(currentDependencies.length > 0){
				var dependency = currentDependencies.pop();
// console.log(step.title, dependency, currentDependencies);
				var dependencyStep = name2step[dependency];
				
				if(dependencyStep == undefined)
					console.log("DANGLING DEPENDENCY", dependency);
				
				if (dependencyStep.skip === false || options.show_skipped_steps === true){
					dependencies.push(dependency);
					continue;
				}
				else {
// console.log("Adding dependencies of " + dependency + ": ",
// dependencyStep.hpc_directives.dependencies, currentDependencies);
					for(var j=0;j<dependencyStep.hpc_directives.dependencies.length; j++){
						var d = dependencyStep.hpc_directives.dependencies[j];
						if(!currentDependencies.includes(d))
							currentDependencies.push(d);
					}
// console.log("New dependencies", currentDependencies);
				}
			}
			
			for(var j=0; j<dependencies.length; j++){
				var toNode = stepname2id[dependencies[j]];
				
				g.setEdge(toNode, fromNode);
			}
			
			// console.log("DEPENDENCIES", step, dependencies,
			// step.hpc_directives.dependencies);
		}
		
		console.log("GRAPH", g);
		
		// Create the renderer
		var render = new dagreD3.render();

		// Set up an SVG group so that we can translate the final graph.
//		var svg = d3.selectAll(".svg-canvas");
//		svg = d3.select(svg.nodes()[index]);
		var svg = d3.select(element).select(".svg-canvas").nodes()[0];
		svg = d3.select(svg);
		svg.select("g").remove();
		var svgGroup = svg.append("g");
		
		svg.attr("width", 600);
		svg.attr("height", 400);
		
		// Run the renderer. This is what draws the final graph.
		render(svgGroup, g);
		
		// Center the graph
		svg.attr("width", g.graph().width + 100);
		svg.attr("height", g.graph().height + 40);
		
		console.log("GRAPH", index, g, svg, svgGroup, svg.attr("width"), svg.attr("height"), g.graph().width, g.graph().height);
		
		return svg;
	};
	
	$scope.download_as = function(type, pipeline, index, $event){
		var svg = $scope.build_graph(pipeline, index, $scope.options);
		
		var filename = $scope.project.id + "_" + pipeline.id + "." + type;
		
		console.log("TRANSFORM TO SVG", svg);
		if(type == "svg"){
			d3_save_svg.save(svg.node(), {
			    filename: filename,
			  });
		}
		else if(type == "png"){
			saveSvgAsPng(document.querySelectorAll('.svg-canvas')[index], filename, {scale: 2});
		}
		
// domtoimage.toSvg(document.querySelectorAll('.svg-canvas')[index], {filter:
// function(node){return (node.tagName !== 'i');}})
// .then(function (dataUrl) {
// console.log("SUCCESS", dataUrl);
// var link = document.createElement('a');
// link.download = $scope.project.id + "_" + pipeline.id + '.svg';
// link.href = dataUrl;
// link.target = "_blank";
// document.body.appendChild(link);
// link.click();
// }, function(resp){
// console.log("ERROR", resp);
// });
	};
});