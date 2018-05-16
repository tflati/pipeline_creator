app.filter('min', function() {
    return function(input1, input2) {
        return Math.min(input1, input2);
    };
});