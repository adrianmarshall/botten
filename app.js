var restify = require('restify');
var builder = require('botbuilder');
// We need this to build our post string
var querystring = require('querystring');
var https = require('https');
var http = require('http')

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
var bot = new builder.UniversalBot(connector);

bot.dialog('/language',function (session) {

	var msg = session.message

    // create function to only use jsonResponse when the function finishes
    // becasue asycnchronous   

// TODO send score botTenDB to get suggestions

    console.log('semantic input: ' + session.userData.semanticInput)
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

// POST data to language API 
        var jsonResponse = PostCode(msg.text,session);
	}

});

bot.dialog('/', [
    function (session, args, next) {
        if (!session.conversationData.name) {
            session.beginDialog('/profile');
        } else {
            next();
        }
    },
    function (session, results) {
        session.send('Hello %s!', session.conversationData.name);
        session.beginDialog('/preface');
       // session.beginDialog('/language');
    }
]);

bot.dialog('/profile', [
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your name?');
    },
    function (session, results) {
        session.conversationData.name = results.response;
        session.endDialog();
    }
]);


bot.dialog('/preface', [
    function (session) {
        builder.Prompts.text(session,'How are you doing?');
    },
    function (session, results) {
        session.send('okay, thanks for sharing that.');
        session.conversationData.semanticInput = results.response + ' ';
        session.endDialog();
        session.beginDialog('/question1');
    }
]);



bot.dialog('/question1', [
    function (session) {
        builder.Prompts.text(session,'Anything planned for the day?');
    },
    function (session, results) {
        session.send('I see. Let me see if I can help make your day even better.');
        session.conversationData.semanticInput = results.response + ' ';
        session.endDialog();
        session.beginDialog('/question2');
    }
]);


bot.dialog('/question2', [
    function (session) {
        builder.Prompts.text(session, ' How would you describe your mood today?');
    },
    function (session, results) {

        var previousInput =  session.conversationData.semanticInput;
        session.conversationData.semanticInput = previousInput+' '+ results.response ;
      //  session.endDialog();
        session.beginDialog('/language');
    }
]);



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
    // TODO Get data from Database and send to user
    GetEvents(score,session);

    return jsonObject;
        });

});


// post the data
  post_req.write(post_data);
  post_req.end();



}


// Send data to Database

function GetEvents(score,session) {

var mood_host = 'bot-event-api.azurewebsites.net';
// Set mood uri based on sentiment score
var mood_uri = '';

if(score > 0.5){
mood_uri = '/api/positiveMoodEvent'
   session.send(" You seem pretty happy. Let me suggest something to keep your spirits going. ");

}else{
    mood_uri= '/api/negativeMoodEvent';
       session.send("hmmm.. Let me look something up that might lighten up your mood.");

}

// TODO get random number between 1-10
var ranNum = Math.floor(Math.random() * 9) + 0 ;
var hours= '48';            // The hours within range to look for 'i.e- set to 24 for tomorrow
mood_uri = mood_uri+'s'+"?count=10&hours="+hours;

console.log("set options");


var options = {
    host: mood_host,
    port: 80,
    path: mood_uri,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
       // 'Accept': 'application/json',
      //  'Content-Length': Buffer.byteLength(post_data)
    }
};
var get_req = http.request(options, function(res) {
    var body = '';

    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        body += chunk;
    });

    res.on('error', function (error) {
        console.log("Error: " + error.stack);
        session.endConversation();
    });

    res.on('end', function () {
   
    var mydata = JSON.parse(body);
    console.log("The status: " + mydata.status);
    //  Get data from Database and send to user
    var event = mydata.data[ranNum];        // random event

    var date = new Date(event.start_time);
    var messageToUser = event.event_name + " , Go here: " + event.event_url +
    " , Starts at " + date.toString();     // TODO convert time from UTC

   session.send("You should checkout this upcoming event: " + messageToUser);
  // session.endDialog();
  session.reset('/preface');
    
   // return data;
        });

});

  get_req.end();



}



