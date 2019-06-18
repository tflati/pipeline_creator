'use strict';

/**
 * @ngdoc filter
 * @name sraSearchApp.filter:capitalise
 * @function
 * @description
 * # capitalise
 * Filter in the sraSearchApp.
 */
app.filter('capitalise', function () {
    return function (input) {
    	return input.charAt(0).toUpperCase();
    };
  });
