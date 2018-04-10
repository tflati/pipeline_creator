app.service("messageService", function(toaster) {
	this.showMessage = function(message, type, title) {
		if(type == undefined) type = "info";
		if(type == undefined) title = "";
		toaster.pop({
			type: type,
			title: title,
			body: message,
			timeout: 3000
		});
	  };
});