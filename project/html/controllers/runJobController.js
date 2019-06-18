app.controller('runJobController', function($scope, apiService, messageService, $document, $stateParams, $timeout, pipeline, job){
	var self = this;
	
	$scope.pipeline = pipeline;
	$scope.job = job;
	console.log("JOB CONTROLLER", $scope.pipeline, $scope.job);
	
	$scope.seeTopLines = function(path){
		
		apiService.see_top_lines($scope.pipeline, path,
			function(resp){
			console.log("TOP LINES", path, resp.data);
				messageService.showMessages(resp.data);
				for(var i=0; i<resp.data.length; i++)
					if(resp.data[i].type == "data")
					{
						$scope.text = resp.data[i].message;
						break;
					}
			},
			function(error){
				console.log("ERROR", error);
			},
			function(){});
	};
	
	$scope.download = function(path){
		
		apiService.download_file($scope.pipeline, path,
			function(result){
				console.log("DOWNLOAD", path, result);
					
				var filename = "download.txt";
				var info = result.headers('Content-Disposition');
				var fields = info.split("; ");
				for(var i=0; i<fields.length; i++){
					var field = fields[i];
					console.log(field);
					if (field.indexOf("filename=") == 0){
						filename = field.replace("filename=", "")
						break;
					}
				}
				var blob = new Blob([result.data], {type: 'text/plain'});
				var url = URL.createObjectURL(blob);
				
				var downloadLink = angular.element('<a target="_self"></a>');
	            downloadLink.attr('href', url);
	            downloadLink.attr('download', filename);
	            console.log("DOWNLOAD", downloadLink, url, filename);
	            var body = $document.find('body').eq(0);
	            body.append(downloadLink)
				downloadLink[0].click();
			
//				for(var i=0; i<resp.data.length; i++)
//					if(resp.data[i].type == "data")
//					{
//						var url = resp.data[i].url;
//						var filename = resp.data[i].filename;
//						
//						var downloadLink = angular.element('<a target="_self"></a>');
//			            downloadLink.attr('href', url);
//			            downloadLink.attr('download', filename);
//			            console.log(downloadLink, url, filename);
//			            var body = $document.find('body').eq(0);
//			            body.append(downloadLink)
//						downloadLink[0].click();
//						break;
//					}
			},
			function(error){
				console.log("ERROR", error);
			},
			function(){});
	};
});