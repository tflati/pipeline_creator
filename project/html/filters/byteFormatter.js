app.filter('byteFormatter', function(){
	return function(x){
		if ( typeof(x) !== 'number' ) return "Unknown size"
		if ( isNaN(x) ) return "Unknown size"
		
		var sizes = ["B", "KB", "MB", "GB", "TB"];
		var s = parseFloat(x);
		var i = 0;
		while (s >= 1024 && i < sizes.length)
		{
			s = s / 1024;
			i += 1;
		}
		
		return s.toLocaleString('en-US', {maximumFractionDigits: 2}) + " " + sizes[i];
	};
});