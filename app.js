var restify = require('restify');
var builder = require('botbuilder');
// We need this to build our post string
var querystring = require('querystring');
var https = require('https');

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
   var jsonResponse = PostCode(msg.text,session);
    // create function to only use jsonResponse when the function finishes
    // becasue asycnchronous   

// TODO send score botTenDB to get suggestions

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
function PostCode(userInput,session) {

  // Build the post string from an object
  var post_data = JSON.stringify(
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
console.log("post data : "+post_data);

console.log("set options");


var options = {
    host: 'westus.api.cognitive.microsoft.com',
    port: 443,
    path:'/text/analytics/v2.0/sentiment',
    method: 'POST',
    headers: {
        'Ocp-Apim-Subscription-Key': '9339895ecd9b4701995ff6b7db31260e',
        'Content-Type': 'application/json'
       // 'Accept': 'application/json',
      //  'Content-Length': Buffer.byteLength(post_data)
    }
};
console.log("set post request");
var post_req = https.request(options, function(res) {
    var body = '';

    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        console.log("body: " + chunk);
        body += chunk;
    });

    res.on('error', function (error) {
        console.log("Error: " + error.stack);
    });

    res.on('end', function () {
    console.log("The returned data: " + body)
    var jsonObject = JSON.parse(body);            // parse API language response

    console.log("User score: " +jsonObject.documents[0]['score']);
    console.log("Errors: " + jsonObject.documents.error);
    // TODO Send data to database

    var score = jsonObject.documents[0]['score'];
   session.send(" Score Response from language API: " + score);
    // TODO Get data from Database and send to user
    return jsonObject;
        });

});

console.log("write/send post data");

// post the data
  post_req.write(post_data);
  post_req.end();



}

