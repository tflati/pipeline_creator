app.factory('apiService', function($http, Upload) {
  var instance = {};
  
  var SERVER = "/pipeline_manager_api/pipeline_manager/";
  
  instance.get_projects = function(successFx, errorFx, finallyFx){
	  var url = SERVER + "projects/";
	  $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.get_pipelines = function(successFx, errorFx, finallyFx){
	  var url = SERVER + "pipelines/";
	  $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.get_templates = function(successFx, errorFx, finallyFx){
	  var url = SERVER + "templates/";
	  $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.load_project = function(project_id, successFx, errorFx, finallyFx){
	  var url = SERVER + "load_project/" + project_id + "/";
	  return $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.save_project = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "save_project/";
	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.create_project = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "create_project/";
	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.delete_project = function(project_id, successFx, errorFx, finallyFx){
	  var url = SERVER + "delete_project/" + project_id + "/";
	  $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  
//  instance.rename_project = function(project, successFx, errorFx, finallyFx){
//	  var url = SERVER + "rename_project/";
//	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
//  };
  
  instance.rename_pipeline = function(project_id, pipeline_id, new_name, successFx, errorFx, finallyFx){
	  if (pipeline_id == "") pipeline_id = "None";
	  var url = SERVER + "rename_pipeline/" + project_id + "/" + pipeline_id + "/" + new_name + "/";
	  $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  
//  instance.produce_scripts = function(project, successFx, errorFx, finallyFx){
//	  var url = SERVER + "produce_scripts/";
//	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
//  };
  
  instance.launch_scripts = function(project, launch, step, successFx, errorFx, finallyFx){
	  var url = SERVER + "launch_scripts/" + step + "/";
	  $http.post(url, {"project": project, "launch": launch}).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.launch_monitor_scripts = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "launch_monitor_scripts/";
	  $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.download_scripts = function(project, launch, successFx, errorFx, finallyFx){
	  var url = SERVER + "download_scripts/";
	  $http.post(url, {"project": project, "launch": launch}).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.download_phenodata = function(data, successFx, errorFx, finallyFx){
	  var url = SERVER + "download_phenodata/";
	  
	  $http({
		    url: url,
		    method: "POST",
		    data: data,
		    headers: {
		       'Content-type': 'application/json'
		    },
		    responseType: 'arraybuffer'
		}).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.get_phenodata = function(project_id, bioproject_id, successFx, errorFx, finallyFx){
	  var url = SERVER + "get_phenodata/" + project_id + "/" + bioproject_id + "/";
	  $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.download_dataset = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "download_dataset/";
	  $http({
		    url: url,
		    method: "POST",
		    data: project, //this is your json data string
		    headers: {
		       'Content-type': 'application/json'
		    },
		    responseType: 'arraybuffer'
		}).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.download_project = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "download_project/" + project.id + "/";
	  $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  
//  instance.download = function(project){
//	  return $http({
//		    url: url,
//		    method: "POST",
//		    data: project, //this is your json data string
//		    headers: {
//		       'Content-type': 'application/json'
//		    },
//		    responseType: 'arraybuffer'
//		}).then(successFx, errorFx).finally(finallyFx);
//  }
  
  instance.filesystem_api = function(data, op, successFx, errorFx, finallyFx){
	  var url = SERVER + "filesystem_api/" + op + "/";
	  $http.post(url, data).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.dataset_api = function(data, successFx, errorFx, finallyFx){
	  var url = SERVER + "dataset_api/";
	  $http.post(url, data).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.job_search_api = function(data, successFx, errorFx, finallyFx){
	  var url = SERVER + "job_search_api/";
	  $http.post(url, data).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.create_new_launch = function(project_id, data, successFx, errorFx, finallyFx){
	  var url = SERVER + "create_new_launch/" + project_id + "/";
	  $http.post(url, data).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.save_pipeline_to_repository = function(pipeline, overwrite, successFx, errorFx, finallyFx){
	  var url = SERVER + "save_pipeline_to_repository/" + overwrite + "/";
	  $http.post(url, pipeline).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.save_monitor_pipeline_to_repository = function(pipeline, overwrite, successFx, errorFx, finallyFx){
	  var url = SERVER + "save_monitor_pipeline_to_repository/" + overwrite + "/";
	  $http.post(url, pipeline).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.delete_pipeline_from_repository = function(pipeline, successFx, errorFx, finallyFx){
	  var url = SERVER + "delete_pipeline_from_repository/";
	  $http.post(url, pipeline).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.save_step_to_repository = function(step, overwrite, successFx, errorFx, finallyFx){
	  var url = SERVER + "save_step_to_repository/" + overwrite + "/";
	  $http.post(url, step).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.delete_step_from_repository = function(step, successFx, errorFx, finallyFx){
	  var url = SERVER + "delete_step_from_repository/";
	  $http.post(url, step).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.rename_step_in_repository = function(old_name, new_name, successFx, errorFx, finallyFx){
	  var url = SERVER + "rename_step_in_repository/" + old_name + "/" + new_name + "/";
	  $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.rename_pipeline_in_repository = function(old_name, new_name, successFx, errorFx, finallyFx){
	  var url = SERVER + "rename_pipeline_in_repository/" + old_name + "/" + new_name + "/";
	  $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.save_monitor_step_to_repository = function(step, overwrite, successFx, errorFx, finallyFx){
	  var url = SERVER + "save_monitor_step_to_repository/" + overwrite + "/";
	  $http.post(url, step).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.get_steps = function(successFx, errorFx, finallyFx){
	  var url = SERVER + "steps/";
	  $http.post(url).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.upload_dataset = function(data, successFx, errorFx, finallyFx){
	  var url = SERVER + "upload_dataset/";
	  
	  Upload.upload({
          url: url,
          data: data
      }).then(successFx, errorFx, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
      }).finally(finallyFx);
  };
  
  instance.upload_phenodata = function(project_id, files, successFx, errorFx, finallyFx){
	  var url = SERVER + "upload_phenodata/" + project_id + "/";
	  
	  Upload.upload({
          url: url,
          data: {file: files}
      }).then(successFx, errorFx, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
      }).finally(finallyFx);
  };
  
  instance.upload_data = function(project_id, files, successFx, errorFx, finallyFx){
	  var url = SERVER + "upload_data/" + project_id + "/";
	  
	  Upload.upload({
          url: url,
          data: {file: files}
      }).then(successFx, errorFx, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
      }).finally(finallyFx);
  };
  
  instance.upload_pipeline_files = function(project_id, pipeline_id, files, successFx, errorFx, finallyFx){
	  var url = SERVER + "upload_pipeline_data/" + project_id + "/" + pipeline_id + "/";
	  
	  Upload.upload({
          url: url,
          data: {file: files}
      }).then(successFx, errorFx, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
      }).finally(finallyFx);
  };
  
  instance.upload_temp = function(files, successFx, errorFx, finallyFx){
	  var url = SERVER + "upload_temp/";
	  
	  Upload.upload({
          url: url,
          data: {file: files}
      }).then(successFx, errorFx, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
      }).finally(finallyFx);
  };
  
  instance.remove_data = function(project_id, file, successFx, errorFx, finallyFx){
	  var url = SERVER + "remove_data/" + project_id + "/";
	  
	  $http.post(url, {"file": file}).then(successFx, errorFx, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
      }).finally(finallyFx);
  };
  
  instance.remove_pipeline_data = function(project_id, pipeline_id, file, successFx, errorFx, finallyFx){
	  var url = SERVER + "remove_pipeline_data/" + project_id + "/" + pipeline_id + "/";
	  
	  $http.post(url, {"file": file}).then(successFx, errorFx, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
      }).finally(finallyFx);
  };
  
  instance.remove_run = function(project_id, run_id, successFx, errorFx, finallyFx){
	  var url = SERVER + "remove_run/" + project_id + "/" + run_id + "/";
	  $http.get(url).then(successFx).catch(errorFx).finally(finallyFx);
  };
  
  instance.stop_jobs = function(project_id, run_id, successFx, errorFx, finallyFx){
	  var url = SERVER + "stop_jobs/" + project_id + "/" + run_id + "/";
	  $http.get(url).then(successFx).catch(errorFx).finally(finallyFx);
  };
  
  instance.import_pipelines = function(project, pipelines, successFx, errorFx, finallyFx){
	  var url = SERVER + "import_pipelines/";
	  
	  $http.post(url, {"project": project, "pipelines":pipelines}).then(successFx).catch(errorFx).finally(finallyFx);
  };
  
  instance.delete_pipeline = function(project_id, pipeline_id, successFx, errorFx, finallyFx){
	  var url = SERVER + "delete_pipeline/" + project_id + "/" + pipeline_id + "/";
	  
	  $http.get(url).then(successFx).catch(errorFx).finally(finallyFx);
  };
  
  instance.add_papers = function(project, bioproject_id, files, successFx, errorFx, finallyFx){
	  var url = SERVER + "add_papers/";
	  console.log("Uploading papers", project, files);
	  
	  Upload.upload({
          url: url,
          data: {file: files, project: Upload.json(project), bioproject_id: bioproject_id}
      }).then(successFx, errorFx, function (evt) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          console.log('progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
      }).catch(function(resp){console.log("ERROR", resp); errorFx(resp);}).finally(finallyFx);
  };
  
  instance.delete_paper = function(project_id, paper_name, successFx, errorFx, finallyFx){
	  var url = SERVER + "delete_paper/" + project_id + "/" + paper_name + "/";
	  $http.get(url).then(successFx).catch(errorFx).finally(finallyFx);
  };
  
  instance.upload_from_ID_list = function(data, successFx, errorFx, finallyFx){
	  var url = SERVER + "upload_from_ID_list/";
	  $http.post(url, data).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.update_monitor_data = function(project, successFx, errorFx, finallyFx){
	  var url = SERVER + "invoke_monitor/";
	  return $http.post(url, project).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.get_monitor_step_data = function(project, pipeline, step, successFx, errorFx, finallyFx){
	  var url = SERVER + "get_monitor_step_data/";
	  $http.post(url, {"project": project, "monitor_pipeline": pipeline, "step": step}).
	  then(successFx, errorFx).
	  finally(finallyFx);
  };
  
  
  instance.get_qos = function(username, cluster, successFx){
	  var url = SERVER + "qos/" + username + "/" + cluster + "/";
	  return $http.get(url).then(successFx, function(result){
		  console.log("ERROR WHILE RETRIEVING QOS", result);
	  });
  };
  
  instance.get_module_url = function(username, cluster){
	  return SERVER + "modules/" + username + "/" + cluster + "/";   
  };
  
  instance.get_account_url = function(username, cluster){
	  return SERVER + "accounts/" + username + "/" + cluster + "/";
  };
  
  instance.get_cluster_users_url = function(username, cluster){
	  return SERVER + "get_cluster_users/" + username + "/" + cluster + "/";
  };
  
  instance.login = function(user, successFx, errorFx, finallyFx){
	  var url = SERVER + "login/";
	  $http.post(url, user).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.register = function(user, successFx, errorFx, finallyFx){
	  var url = SERVER + "register/";
	  $http.post(url, user).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.logout = function(user, successFx, errorFx, finallyFx){
	  var url = SERVER + "logout/";
	  $http.post(url, user).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.users = function(successFx, errorFx, finallyFx){
	  var url = SERVER + "users/";
	  $http.get(url).then(successFx, errorFx).finally(finallyFx);
  };
  instance.save_users = function(users, successFx, errorFx, finallyFx){
	  var url = SERVER + "save_users/";
	  $http.post(url, users).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.see_top_lines = function(pipeline, path, successFx, errorFx, finallyFx){
	  var url = SERVER + "see_top_lines/";
	  $http.post(url, {pipeline: pipeline, path: path}).then(successFx, errorFx).finally(finallyFx);
  };
  
  instance.download_file = function(pipeline, path, successFx, errorFx, finallyFx){
	  var url = SERVER + "download_file/";
	  $http.post(url, {pipeline: pipeline, path: path}).then(successFx, errorFx).finally(finallyFx);
  };
  
  return instance;
});