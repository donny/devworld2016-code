var express = require("express");
var bodyParser = require('body-parser');
var url = require('url');
var redis = require('redis');

var redisURL = url.parse(process.env.REDISCLOUD_URL);
var client = redis.createClient(redisURL.port, redisURL.hostname, {no_ready_check: true});
client.auth(redisURL.auth.split(":")[1]);

var app = express();
app.use(bodyParser.json());

app.get('/', function(req, res) {
  client.get('data', function(err, reply) {
    res.send(reply);
  });
});

app.post('/', function(req, res) {
  client.set('data', req.body.data);
  res.send(req.body.data);
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});
