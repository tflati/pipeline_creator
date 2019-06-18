app.service("messageService", function(toaster) {
	this.showMessage = function(message, type, title, timeout) {
		if(type == undefined) type = "info";
		if(title == undefined) title = "";
		if(timeout == undefined) timeout = 5000;
		
		// Types of messages can be:
		// success, error, info, wait, warning
			
		toaster.pop({
			type: type,
			title: title,
			body: message,
			timeout: timeout
		});
	  };
	  
	this.showMessages = function(data){
		if (!Array.isArray(data)) data = [data];
		console.log("MESSAGES", data);
		for(var i in data)
			if (data[i].type != "data")
				this.showMessage(data[i].message, data[i].type);
	};
});