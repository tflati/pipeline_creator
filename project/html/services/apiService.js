app.factory('apiService', function($http, Upload) {
  var instance = {};
  
  var SERVER = "/pipeline_manager_api/pipeline_manager/";
  
  instance.get_projects = function(successFx){
	  var url = SERVER + "projects/";
	  $http.get(url).then(successFx, function(result){
		  console.log("ERROR WHILE RETRIEVING PROJECTS", result);
	  });
  };
  
  instance.get_genomes = function(clusterId, successFx){
	  var url = SERVER + "genomes/" + clusterId + "/";
	  $http.get(url).then(successFx, function(result){
		  console.log("ERROR WHILE RETRIEVING GENOMES", result);
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
  
  instance.delete_project = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "delete_project/";
	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.rename_project = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "rename_project/";
	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.produce_scripts = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "produce_scripts/";
	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.download_scripts = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "download_scripts/";
	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.download_csv = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "download_csv/";
	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.get_module_url = function(clusterId){
	  return SERVER + "modules/" + clusterId + "/";   
  };
  
  instance.upload_samples = function(files, successFx, errorFx, finallyFx){
	  var url = SERVER + "upload_samples/";
	  
	  Upload.upload({
          url: url,
          data: {file: files}
      }).then(successFx, errorFx, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
      });
  };
  
  return instance;
});