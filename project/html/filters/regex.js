app.filter('regex', function() {
  return function(input, field, regex) {
    var patt = new RegExp(regex, 'i');
    var out = [];
    for (var i = 0; i < input.length; i++) {
      if (patt.test(input[i][field]))
        out.push(input[i]);
    }
    return out;
  };
});