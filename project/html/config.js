var app = angular.module('pipelineCreator',
		[
			'ngMaterial',
			'ngCookies',
			'ngMessages',
			'ngSanitize',
			'ngAnimate',
			'toaster',
			'ngRoute',
			'ngMdIcons',
			'tooltips',
			'ngMeta',
			'ngFileUpload',
			'vAccordion',
			'angularMoment',
			'mdColorPicker',
			'chart.js',
			'ngDragDrop',
			'ngclipboard',
			'angularUtils.directives.dirPagination',
			'angular.filter',
			'ui.router'
		]);

app.config(function($mdThemingProvider, $httpProvider) {
	
	$httpProvider.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
	$httpProvider.defaults.xsrfCookieName = 'csrftoken';
	$httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
	
		$mdThemingProvider.theme("default")
		      .primaryPalette('red')
		      .accentPalette('orange')
		      .warnPalette('yellow');
	});

	app.config(['$routeProvider', '$locationProvider', '$stateProvider',
	  function($routeProvider, $locationProvider, $stateProvider) {
		
		$stateProvider
			.state({
			  name: 'home',
			  url: '/',
			  controller: 'homeController',
			  templateUrl: 'templates/home.html'
			})
			.state({
			  name: 'step_repository',
			  url: '/step_repository',
			  controller: 'stepRepositoryController',
			  templateUrl: 'templates/step_repository.html'
			})
			.state({
			  name: 'pipeline_repository',
			  url: '/pipeline_repository',
			  controller: 'pipelineRepositoryController',
			  templateUrl: 'templates/pipeline_repository.html'
			})
			.state({
			  name: 'projects',
			  url: '/projects',
			  controller: 'projectsController',
			  templateUrl: 'templates/projects.html'
			})
			.state({
			  name: 'create-new-project',
			  url: '/create-new-project',
			  controller: 'createProjectController',
			  templateUrl: 'templates/create_new_project.html'
			})
			.state({
			  name: 'login',
			  url: '/login',
			  controller: 'loginController',
			  templateUrl: 'templates/login.html'
			})
			.state({
			  name: 'logout',
			  url: '/logout',
			  controller: 'logoutController',
			  templateUrl: 'templates/logout.html'
			})
			.state({
			  name: 'register',
			  url: '/register',
			  controller: 'registerController',
			  templateUrl: 'templates/register.html'
			})
			.state({
			  name: 'user-admin-page',
			  url: '/user-admin-page',
			  controller: 'usersController',
			  templateUrl: 'templates/user-admin-page.html'
			})
			.state({
			  name: 'project',
			  url: '/{project_id}',
			  controller: 'mainController',
			  templateUrl: 'templates/project.html',
			  resolve: {
				  project: function(apiService, messageService, $stateParams){
					  messageService.showMessage("Opening project " + $stateParams.project_id, "info");
					  return apiService.load_project($stateParams.project_id, function(result){
							console.log("[SELECT PROJECT]", result);
							messageService.showMessage("Project " + result.data.id + " correctly loaded.", "success");
							return result.data;
						}, function(result){
							console.log("[SELECT PROJECT] AJAX RESULT ERROR", result);
							messageService.showMessage("Server error: " + result.status, "error");
						}, function(){});
				  }
			  }
			})
					.state({
					  name: 'project.logs',
					  url: '/logs',
					  templateUrl: 'templates/logs.html'
					})
					.state({
					  name: 'project.dataset',
					  url: '/dataset',
					  templateUrl: 'templates/dataset.html'
					})
					.state({
					  name: 'project.pipeline',
					  url: '/pipeline',
					  templateUrl: 'templates/project_pipelines.html'
					})
					.state({
					  name: 'project.monitor_definition',
					  url: '/monitor_definition',
					  templateUrl: 'templates/monitor_definition.html'
					})
					.state({
					  name: 'project.launch',
					  url: '/launch',
					  templateUrl: 'templates/launch.html'
					})
					.state({
					  name: 'project.monitor',
					  url: '/monitor',
					  templateUrl: 'templates/monitor.html'
					})
					.state({
					  name: 'project.jobs',
					  abstract: true,
					  url: '/jobs',
					  controller: 'runListController',
					  templateUrl: 'templates/runs_main_page.html'
					})
							.state({
							  name: 'project.jobs.all',
							  url: '/all',
							  templateUrl: 'templates/run_list.html'
							})
							.state({
							  name: 'project.jobs.run',
							  abstract: true,
							  url: '/run/{run_id}',
							  controller: 'runJobsController',
							  templateUrl: 'templates/run_jobs_main_page.html',
							  resolve: {
								  run: function(project, messageService, $stateParams){
									  console.log("CONFIG RUN", project);
									  messageService.showMessage("Opening run " + $stateParams.run_id, "info");
									  for(var i in project.runs)
										if(project.runs[i].id == $stateParams.run_id){
											messageService.showMessage("Run " + $stateParams.run_id + " correctly loaded.", "success");
											return project.runs[i];
										}
									  
									  messageService.showMessage("Global run correctly loaded.", "success");
									  return {id: "global", pipelines: project["pipelines"], runs: project.runs};
								  },
								  jobs: function(project, apiService, messageService, $stateParams){
									  var run = undefined;
									  for(var i in project.runs)
										if(project.runs[i].id == $stateParams.run_id){
											run = project.runs[i];
											break;
										}
									  
									  if (run == undefined)
										  run = project;
									  
									  messageService.showMessage("Loading jobs of run " + $stateParams.run_id, "info");
									  return apiService.update_monitor_data(run, function(result){
											
										  console.log("CONFIG JOBS", result);
										  messageService.showMessage("Jobs of run " + $stateParams.run_id + " correctly loaded.", "success");
										  
											var messages = result.data.messages;
											for(var i in messages)
												messageService.showMessage(messages[i].message, messages[i].type, undefined, 5000);
											
											return result.data.data;
									  }, function(error){console.log("JOBS ERROR", error);}, function(){});
								  }
							  }
							})
									.state({
									  name: 'project.jobs.run.all',
									  url: '/all',
									  templateUrl: 'templates/run_jobs_all.html'
									})
									.state({
									  name: 'project.jobs.run.selection',
									  url: '/{pipeline_id}/{step_id}',
									  controller: 'runJobsOfStepController',
									  templateUrl: 'templates/run_job_step_selection.html',
									  resolve: {
										  pipeline: function(run, messageService, $stateParams){
											  messageService.showMessage("Loading jobs of pipeline " + $stateParams.pipeline_id, "info");
											for(var i in run.pipelines)
												if(run.pipelines[i].id == $stateParams.pipeline_id){
													messageService.showMessage("Jobs of pipeline " + $stateParams.pipeline_id + " correctly loaded.", "success");
													return run.pipelines[i];
												}
											return undefined;
										  },
										  step: function(run, $stateParams){
											for(var i in run.pipelines)
												if(run.pipelines[i].id == $stateParams.pipeline_id)
													for(var j in run.pipelines[i].steps)
														if(run.pipelines[i].steps[j].title == $stateParams.step_id)
															return run.pipelines[i].steps[j];
											return undefined;
										  }
									  }
									})
									.state({
									  name: 'project.jobs.run.job',
									  url: '/{pipeline_id}/job_id={job_id}',
									  controller: 'runJobController',
									  templateUrl: 'templates/run_job.html',
									  resolve: {
										  pipeline: function(run, $stateParams){
											for(var i in run.pipelines)
												if(run.pipelines[i].id == $stateParams.pipeline_id)
													return run.pipelines[i];
											return undefined;
										  },
										  job: function(jobs, messageService, $stateParams){
											for(var i in jobs)
												if(jobs[i].JobID == $stateParams.job_id) {
													messageService.showMessage("Job " + $stateParams.job_id + " correctly loaded.", "success");
													return jobs[i];
												}
											return undefined;
										  }
									  }
									})
					.state({
					  name: 'project.filesystem',
					  url: '/filesystem/',
					  templateUrl: 'templates/filesystem.html'
					})
					.state({
					  name: 'project.info',
					  url: '/info/',
					  templateUrl: 'templates/project_info.html'
					})
			;
		
	    $locationProvider.html5Mode(true);
	}]);

app.config(['$mdIconProvider', function($mdIconProvider) {
    $mdIconProvider.icon('md-close', 'img/icons/ic_close_24px.svg', 24);
}]);

// app.run(function(amMoment){
// amMoment.changeLocale('it');
// });


