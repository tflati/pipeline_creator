app.controller('runJobsController', function($scope, $state, apiService, messageService, $stateParams, $filter, $timeout, run, jobs){
	var self = this;
	
	$scope.run = run;
	$scope.jobs = jobs;
	
	console.log("JOB INFO CONTROLLER", run, jobs);
	
//	$scope.run_id = $stateParams.run_id;
//	if($scope.run == undefined){
//		for(var i in $scope.project.runs)
//			if($scope.project.runs[i].id == $scope.run_id){
//				$scope.run = $scope.project.runs[i];
//				break;
//			}
//		console.log("SELECTING RUN", $scope.run_id, $scope.run);
//	}
	
	$scope.removing = false;
	$scope.disabled = false;
	
	$scope.stop_jobs = function(x){
		apiService.stop_jobs($scope.project.id, x.id,
				function(result){
					console.log("STOP RUN", result);
					
					run.jobsRunningOrPending = false;
					
					for(var j in result.data)
						if (result.data[j].type != "data")
							messageService.showMessage(result.data[j].message, result.data[j].type);
					
					 $scope.update_monitor_data(x);
				},
				function(error){console.log("ERROR", error);});
	};
	
//	$scope.select_jobs = function(step){
//		
//		$timeout(function(){
//			$scope.selection = {
//					clicked: [],
//					step: step
//			};
//			$scope.selection.clicked = [];
//			for(var i=0; i<$scope.jobs.length; i++) {
//				var job = $scope.jobs[i];
//				var step_name = job.NodeName.split("#")[1] || job.StepTitle;
//				
//				if(step_name == step.title)
//					$scope.selection.clicked.push(job);
//			}
//			
//			console.log("[SELECTING JOBS]", $scope, $scope.selection, step);
//		});
//	};
	
	$scope.goBack = function(){
		$timeout(function(){
			$scope.selection = undefined;
			console.log("GO BACK", $scope);
		});
	};
	
	$scope.create_graphs = function(){
		console.log("CREATING GRAPHS", $scope.jobs);
		
		$scope.monitor = {
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
			};
		
		$scope.steps_progress = {};
		$scope.step_progress_template = {
				status: {
					total: 0,
					labels: [],
					series: [],
					colors: [],
					data: [],
					raw_data: {},
					options: {
						responsive: true, maintainAspectRatio: false,
						scales: {
				            xAxes: [{
				                stacked: true
				            }],
				            yAxes: [{
				                stacked: true
				            }]
				        }
					}
				}
		};
		
		var counter = {};
		var colors = {};
		
		var jobsRunningOrPending = false;
		for(var l in $scope.jobs){
			var job = $scope.jobs[l];
			
			var s = job.State;
			
			var status_name = s.id;
			var status_color = s.color;
			colors[status_name] = status_color;
			
			if(!(status_name in counter)) counter[status_name] = 0;
			counter[status_name] += 1;
			
			jobsRunningOrPending |= status_name == "RUNNING" || status_name == "PENDING";
			
			var pipeline_id = job.NodeName.split("#")[0] || job.PipelineID;
			if( !(pipeline_id in $scope.steps_progress)) $scope.steps_progress[pipeline_id] = {};
			
			var step_name = job.NodeName.split("#")[1] || job.StepTitle;
			if( !(step_name in $scope.steps_progress[pipeline_id])) $scope.steps_progress[pipeline_id][step_name] = angular.copy($scope.step_progress_template);
			
			var step_progress = $scope.steps_progress[pipeline_id][step_name];
			step_progress.status.total += 1;
			
			if(!(status_name in step_progress.status.raw_data))
				step_progress.status.raw_data[status_name] = {color: status_color, count: 0};
			step_progress.status.raw_data[status_name].count += 1;
		}
		
		for(var k in counter){
			$scope.monitor.labels.push(k);
			$scope.monitor.colors.push(colors[k]);
			$scope.monitor.data.push(counter[k]);
		}
		
		var statuses = Object.keys(counter).sort();
		for(var pipeline_id in $scope.steps_progress){
			for(var step_name in $scope.steps_progress[pipeline_id]){
				var step_progress = $scope.steps_progress[pipeline_id][step_name];
				for(var i in statuses){
					var status_name = statuses[i];
					var d = step_progress.status.raw_data[status_name];
					if(d == undefined) continue;
					
					step_progress.status.series.push(status_name);
					step_progress.status.colors.push(d.color);
					step_progress.status.data.push([d.count]);
				}
			}
		}
		
		$scope.run.jobsRunningOrPending = jobsRunningOrPending;
		
		console.log("STEPS PROGRESS", $scope.steps_progress, $scope.monitor);
	};
	
//	$scope.filterJobs = function(list){
//		var filtered = $filter('filter')(list, $scope.filterExpression);
//		if ($scope.job_search.results.options.show_only_selected)
//			filtered = $filter('filter')(filtered, '{selected: true}');
//		return filtered;
//	};
	
	$scope.job_search = {};
	$scope.job_search_api = function(fs){
		if( !fs.results )
			fs.loading = true;
		
		apiService.job_search_api(fs.results == undefined ? $scope.jobs : fs,
				function(result){
				
				if (result.data[0].message){
					if(fs.results == undefined) fs.results = result.data[0].message;
					else {
						fs.results.matches.length = 0;
						fs.results.filters = result.data[0].message.filters;
						for(var i=0; i<result.data[0].message.matches.length;i++)
							fs.results.matches.push(result.data[0].message.matches[i]);
					}
				}
				console.log("[JOB SEARCH API] AJAX RESULT", result, fs);
				
			}, function(result){
				console.log("[JOB SEARCH API] AJAX RESULT ERROR", result);
				messageService.showMessage("Server error: " + result.status, "error");
			}, function(){
				fs.loading = false;
			});
	};
	
	$scope.create_new_launch = function(job_search){
		console.log("CREATE NEW LAUNCH", job_search);
		apiService.create_new_launch($scope.project.id, job_search.results,
				function(result){
					console.log("[CREATE NEW LAUNCH] AJAX RESULT", result);
					$scope.project.launches.push(result.data);
					$state.go("project.launch");
				}, function(result){
					console.log("[CREATE NEW LAUNCH] AJAX RESULT ERROR", result);
					messageService.showMessage("Server error: " + result.status, "error");
				}, function(){
				});
	};
	
	$scope.update_monitor_data = function(project){
		
		console.log("ASKING MONITOR DATA OF", project);
		
		$scope.disabled = true;
		apiService.update_monitor_data(project, function(result){
			console.log("MONITOR RESULT", result);
			
			var jobsRunningOrPending = false;
			
			var messages = result.data.messages;
			var data = result.data.data;
			$scope.jobs = data;
			
			// Step-wise indicators
//			$scope.statuses = ["BOOT_FAIL", "CANCELLED", "COMPLETED", "CONFIGURING", "COMPLETING", "DEADLINE", "FAILED", "NODE_FAIL", "OUT_OF_MEMORY", "PENDING", "PREEMPTED", "RUNNING", "RESV_DEL_HOLD", "REQUEUE_FED", "REQUEUE_HOLD", "REQUEUED", "RESIZING", "REVOKED", "SPECIAL_EXIT", "STOPPED", "SUSPENDED", "TIMEOUT"]
			
			for(var i in messages)
				messageService.showMessage(messages[i].message, messages[i].type, undefined, 5000);
			
			project.jobsRunningOrPending = jobsRunningOrPending;
			$scope.create_graphs();
			
		}, function(error){
			console.log("THERE WAS SOME ERROR IN JOB STATUS RETRIEVAL", error);
		}, function(){$scope.disabled = false;});
	};
	
	$scope.create_graphs();
});