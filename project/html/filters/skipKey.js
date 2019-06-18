app.filter('skipKey', function() {
	return function(items, field) {
        var result = {};
        angular.forEach(items, function(value, key) {
            if (key != field)
                result[key] = value;
        });
        return result;
    };
});