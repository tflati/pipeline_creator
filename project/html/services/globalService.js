app.factory('globalService', function($http, apiService) {
  var instance = {};
  
  instance["pipelines"] = [];
  instance["templates"] = [];
  
  apiService.get_pipelines(function(result){
	  console.log("PIPELINES", result);
	  instance["pipelines"] = result.data.pipelines;
  });
  
  apiService.get_templates(function(result){
	  console.log("TEMPLATES", result);
	  instance["templates"] = result.data.templates;
  });
  
  return instance;
});