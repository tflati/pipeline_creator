app.factory('apiService', function($http) {
  var instance = {};
  
  var SERVER = "/pipeline_manager_api/pipeline_manager/";
  
  instance.get_projects = function(successFx){
	  var url = SERVER + "projects/";
	  $http.get(url).then(successFx, function(result){
		  console.log("ERROR WHILE RETRIEVING PROJECTS", result);
	  });
  };
  
  instance.load_project = function(project_id, successFx, errorFx, finallyFx){
	  var url = SERVER + "load_project/" + project_id + "/";
	  $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.save_project = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "save_project/";
	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.produce_scripts = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "produce_scripts/";
	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.get_module_url = function(){
	  return SERVER + "modules/";   
  };
  
  return instance;
});