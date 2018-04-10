app.directive('myAutocomplete', function() {
  return {
	templateUrl: "templates/autocomplete.html",
	controller: "autocompleteController",
	transclude: true,
	scope: {
		label: '@',
        url: '=',
        onSelect: '&'
    }
  };
});