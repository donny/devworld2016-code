var env = require('./env-variables');
var twilio = require('twilio');
var request = require('request');

var twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
var resp = new twilio.TwimlResponse();

exports.handler = function(event, context) {
  var payload = event.payload;

  resp.say(payload);

  request.post('http://persistence.herokuapp.com', {
    json: { data: resp.toString() }
  }, function (error, response, body) {
    twilioClient.calls.create({
      //url: "http://demo.twilio.com/docs/voice.xml",
      url: "http://hello.herokuapp.com",
      to: "+6100",
      method: 'GET',
      from: env.TWILIO_NUMBER
    }, function(err, call) {
      if (err) return context.fail('Network error');

      context.succeed('OK');
    });
  });
};
