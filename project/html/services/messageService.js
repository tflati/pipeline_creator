app.service("messageService", function(toaster) {
	this.showMessage = function(message, type, title, timeout) {
		if(type == undefined) type = "info";
		if(title == undefined) title = "";
		if(timeout == undefined) timeout = 3000;
		
		toaster.pop({
			type: type,
			title: title,
			body: message,
			timeout: timeout
		});
	  };
});