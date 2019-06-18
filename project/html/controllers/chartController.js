app.controller('chartController', function($scope, apiService, messageService, $state){
	var self = this;
	
	$scope.onChartClick = function (points, evt) {
	    //$scope.select_jobs($scope.step);
		$state.go('project.jobs.run.selection', {pipeline_id: $scope.pipeline.id, step_id: $scope.step.title});
	};
});