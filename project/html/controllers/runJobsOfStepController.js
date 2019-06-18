app.controller('runJobsOfStepController', function($scope, $filter, apiService, messageService, $stateParams, $timeout, pipeline, step){
	var self = this;
	
	$scope.pipeline = pipeline;
	$scope.step = step;
	
	console.log("JOB DETAIL CONTROLLER", pipeline, step);
	
	$scope.clicked = [];
	for(var i=0; i<$scope.jobs.length; i++) {
		var job = $scope.jobs[i];
		var step_name = job.NodeName.split("#")[1] || job.StepTitle;
		
		if(step_name == $scope.step.title)
			$scope.clicked.push(job);
	}
	console.log("[SELECTING JOBS]", $scope, $scope.clicked, $scope.step);
	
	$scope.select_graph_dimension = function(){
		$scope.selection_graph = {
			status: {
				total: 0,
				labels: [],
				series: [],
				colors: [],
				data: [],
				raw_data: {},
				options: {
					responsive: true,
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
		
		var filtered = $filter('filter')($scope.clicked, $scope.filterExpression);
		
		var counts = {};
		for(var l in filtered){
			var job = filtered[l];
			
			for(var i in job.tags){
				var tag = job.tags[i];
				if(tag.type == $scope.graphField){
					if(!(tag.name in counts)) counts[tag.name] = 0;
					counts[tag.name] += 1;
				}
			}
		}
		
		for(var k in counts){
			$scope.selection_graph.status.data.push(counts[k]);
			$scope.selection_graph.status.labels.push(k);
		}
	};
	
	$scope.$watch(function(){return $scope.filterExpression;}, function(newValue, oldValue){
		if(newValue != oldValue)
			$scope.select_graph_dimension();
		}
	);
});