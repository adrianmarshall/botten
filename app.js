var restify = require('restify');
var builder = require('botbuilder');
// We need this to build our post string
var querystring = require('querystring');
var http = require('http');

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

// POST data to language API 
   var jsonResponse = PostCode(msg.text);
   session.send(" Response from language API" + jsonResponse);

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



// Create POST data from user
function PostCode(userInput) {

  // Build the post string from an object
  var post_data = querystring.stringify(
  {
  'documents': [
    {
      'language': 'en',
      'id': 'string',
      'text': userInput
    }
  ]
}
  );

var options = {
    host: 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment',
    port: 80,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(post_data)
    }
};

var post_req = http.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log("body: " + chunk);
    });

    request.on('end', function () {
    var jsonObject = JSON.parse(data);            // parse API language response

    console.log("JSON response: " +jsonObject);
    // TODO Send data to database
    // TODO Get data from Database and send to user
    return jsonObject;
        });

});

// post the data
  post_req.write(post_data);
  post_req.end();
}

