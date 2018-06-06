app.factory('globalService', function($http, apiService) {
  var instance = {};
  
  instance["pipelines"] = [];
  
  apiService.get_pipelines(function(result){
	  console.log("PIPELINES", result);
	  instance["pipelines"] = result.data.pipelines;
  });
  
  return instance;
});