var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {

     session.send("Say 'help' or something else...");
     session.send("Hi... I'm the alarm bot sample. I can set new alarms or delete existing ones.");
	
	var msg = session.message

	if (msg.attachments && msg.attachments.length > 0) {
		
		var attachment = msg.attachments[0];

		console.log("in if");

		session.send({
            text: "NAGRAJ SENT:",
            attachments: [
                {
                    contentType: attachment.contentType,
                    contentUrl: attachment.contentUrl,
                    name: attachment.name
                }
            ]
        });

	} else {
		console.log("in else");
		session.send("Nagraj & Team said: %s", session.message.text);
	}

});
