var app = angular.module('pipelineCreator',
		[
			'ngMaterial',
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
			'ngclipboard'
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
	}]);

app.config(['$mdIconProvider', function($mdIconProvider) {
    $mdIconProvider.icon('md-close', 'img/icons/ic_close_24px.svg', 24);
}]);


