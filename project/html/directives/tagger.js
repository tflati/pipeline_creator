app.directive('tagger', function($timeout) {
  return {
	    restrict: 'E',
	    transclude: true,
	    templateUrl: "templates/tagger.html",
	    controller: "taggerController",
	    scope: {
	    	chosenTags: '=target',
	    	tags: '='
	    }
	  }
	});