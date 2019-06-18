'use strict';

/**
 * @ngdoc service
 * @name sraSearchApp.user
 * @description
 * # user
 * Service in the sraSearchApp.
 */
app.service('userService', function ($cookies, apiService, $location, $http, toaster) {
	
	var thisService = this;
	    
    this.login = function(){
    	thisService.update();
    };
    
    this.update = function(){
    	this.username = $cookies.get('username');
    	this.loggedIn = $cookies.get('logged_in') == "True" || false;
    	this.loginToken = $cookies.get('login_token');
    	this.is_admin = $cookies.get('is_admin') == 'True' || false;
    	
    	console.log("UPDATE USER", $cookies, this);
    };
    
    this.logout = function(user){
    	apiService.logout(user,
    			function(response){
					console.log(response);
					thisService.update();
					console.log($cookies.get('username'), $cookies.get('logged_in'));
	  		},
	  		function(response){
				toaster.pop({
			            type: "error",
			            title: "Server error",
			            body: "There was an error during login. Please, try again.",
			            timeout: 3000
			        });
				console.log("ERROR", response);
			},
			function(){
			}
    	);
    };
    
    this.update();
  });
