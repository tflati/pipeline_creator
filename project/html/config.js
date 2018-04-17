var app = angular.module('pipelineCreator',
		[
			'ngMaterial',
			'ngSanitize',
			'ngAnimate',
			'toaster',
			'ngRoute',
			'ngMdIcons',
			'tooltips',
			'ngMeta',
			'ngFileUpload',
			'vAccordion',
			'angularMoment'
		]);

app.config(function($mdThemingProvider, $httpProvider) {
	
	$httpProvider.defaults.headers.post['Content-Type'] = 'application/json;charset=utf-8';
	$httpProvider.defaults.xsrfCookieName = 'csrftoken';
	$httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
	
		$mdThemingProvider.theme('big-data-theme')
		      .primaryPalette('red')
		      .accentPalette('amber')
		      .warnPalette('amber');
	});

app.config(['$routeProvider', '$locationProvider',
	  function($routeProvider, $locationProvider) {
	    $routeProvider.when('/', {
	        templateUrl: 'templates/home.html',
	        controller: 'mainController',
	        controllerAs: 'ctrl'
	      });

	    $locationProvider.html5Mode(true);
	}])