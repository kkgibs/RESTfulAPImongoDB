// Kyle Gibson
// # CIS 445 RESTFUL server
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
const get_test = require('test_data/get_test.json');
const post_test = require('test_data/post_test.json');
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
//var urlencodedParser = bodyParser.urlencoded({ extended: false })    //not sure about the use of the URL encoding, including for now

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var messages = [];
var sockets = [];

io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

router.get('/review/:reviewid', function (req, res) {           
        res.json(get_test);
    });

// get random review by stars
router.get('/review/:n/:stars', function (req, res) {           
        res.json(get_test);
    });
    
// get random review by date
router.get('/review/:n/:from_date/:to_date', function (req, res) {   //how to format/parse date?       
        res.json(get_test);
    });
    
router.post('/review', jsonParser, function (req, res) {
        if (!req.body) return res.sendStatus(400);
          
          res.send('for POST: you sent the review id, ' + req.body.id + '\nHere is some test data: \n' + JSON.stringify(post_test));      
        
    });    
    
router.put('/review', function (req, res) {
        res.send("for PUT: reviewid is set to " + req.body.reviewid);     //add review body to response
    });

router.delete('/review', function (req, res) {
        res.send("reviewid is set to " + req.params.reviewid);
    });    

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("CIS 445 server listening at", addr.address + ":" + addr.port);
});
