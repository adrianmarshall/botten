var restify = require('restify');
var builder = require('botbuilder');

// Setup bot and root message handler
var connector = new builder.ChatConnector();
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("Say 'help' or something else...");
});


// Add help dialog
bot.dialog('help', function (session) {
    session.send("I'm a simple echo bot.");
}).triggerAction({ matches: /^help/i });

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});

server.post('/api/messages',connector.listen());

/*

// Create bot and add dialogs
var connector = new builder.ChatConnector({
   appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {

     session.send("Say 'help' or something else...");
     session.send("Hi... I'm the alarm bot sample. I can set new alarms or delete existing ones.");

});

*/