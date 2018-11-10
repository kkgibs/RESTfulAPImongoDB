// Kyle Gibson
// # CIS 445 RESTFUL Mongo Amazon Review Server
//
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
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);
var mongoClient = require('mongodb').MongoClient; // initializes the mongodb library and gets a client object
var url = "mongodb://omega.unasec.info/amazon";


router.use(express.static(path.resolve(__dirname, 'client')));


router.get('/review/:reviewid', jsonParser, function (req, res) {           
    mongoClient.connect(url,  { useNewUrlParser: true }, function(err, db) { 
    if (err) throw err;
    var dbo = db.db("amazon");   
    var collection = dbo.collection('reviews');
    collection.aggregate([{$match: {"review.id": `${req.params.reviewid}`}}]).toArray(function(err, results) {
    if(!err) {
        /*console.log(results.length);
        for(var i = 0; i < results.length; i++) {
          console.log(results[i]);
        }*/
        res.json(results);
    }
    else {
        res.send(err);
       db.close();
    }
     });
    });
});

// get random review by stars
router.get('/review/:n/:stars', function (req, res) {      
 mongoClient.connect(url,  { useNewUrlParser: true }, function(err, db) { 
    if (err) throw err;
    var stars = parseInt(req.params.stars);
    var review_num = parseInt(req.params.n);
    var dbo = db.db("amazon");   
    var collection = dbo.collection('reviews');
    collection.aggregate([{$match: {"review.star_rating": stars }}, 
    { $sample: { size: review_num } }]).toArray(function(err, results) { 
    if(!err) {
        /*console.log(results.length);
        for(var i = 0; i < results.length; i++) {
          console.log(results[i]);
        }*/
        res.json(results);
    }
    else {
        res.send(err);
       db.close();
    }
     });
    });
});
    
// get random review by date
router.get('/review/:n/:from_date/:to_date', function (req, res) {      
    mongoClient.connect(url,  { useNewUrlParser: true }, function(err, db) { 
        if (err) throw err;
        var from = new Date(req.params.from_date);
        var to = new Date(req.params.to_date);
        var review_num = parseInt(req.params.n);
        var dbo = db.db("amazon");   
        var collection = dbo.collection('reviews');
        collection.aggregate([{$match: {$and: [{"review.date": {$gte : from}}, {"review.date": {$lte: to}}]}}, 
        { $sample: { size: review_num } }]).toArray(function(err, results) { 
        if(!err) {
            res.json(results);
        }
        else {
            res.send(err);
           db.close();
        }
         });
    });
});
    
router.post('/review', jsonParser, function (req, res) {
        if (!req.body) return res.sendStatus(400);
        mongoClient.connect(url,  { useNewUrlParser: true }, function(err, db) { 
        if (err) throw err;
        var dbo = db.db("amazon");   
        var collection = dbo.collection('reviews');
        collection.insertOne(req.body, function(err, results) {
            if (err) throw err;
            res.json(results);
            db.close();
        });
    });
});    
    
router.put('/review/:reviewid', jsonParser, function (req, res) {
        //res.send("for PUT: reviewid is set to " + req.params.reviewid + '\n'+ 'review body: ' + req.body);
        mongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("amazon");
        var collection = dbo.collection('reviews');
        var filter = { "review.id" : req.params.reviewid };
        var newvalues = { $set: req.body};
        collection.updateMany(filter, newvalues, {multi: false}, function(err, results) {
        /*console.log(results.length);
        for(var i = 0; i < results.length; i++) {
          console.log(results[i]);
        }*/
            if (err) throw err;
            res.send(results);
            db.close();
  });
});
    });

router.delete('/review', jsonParser, function (req, res) {
        res.send("for DELETE: reviewid is set to " + req.body.reviewid +'\n');
    });    
    
// Delete a review
router.delete('/review/:reviewid', jsonParser, function (req, res) {
  mongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db("amazon");  
      var collection = dbo.collection('reviews');
      var myquery = { "review.id" : `${req.params.reviewid}` };
      
      collection.deleteMany(myquery, function(err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        db.close();
      });
  });
});

// Get random reviews by stars
router.get('/review/:n/:stars', function(req, res) {
  res.send("These are reviews with " + req.params.stars + " stars.");
});

// Get random reviews by date
router.get('/review/:n/:from_date/:to_date', function(req, res) {
  res.send("These are reviews from " + req.params.from_date + " to " + req.params.to_date);
});

router.get('/review/helpful/:prodid', jsonParser, function (req, res) {          
    mongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db("amazon");  
      var collection = dbo.collection('reviews');
  
      collection.aggregate([ 
        { $limit : 1000000 }, 
        { $match : { "product.id" : `${req.params.prodid}` }}, 
        { 
          $group: 
            { 
              _id: null, 
              avgHelpfulVotes: { $avg : "$votes.helpful_votes" } 
              
            }
        }
        ]).toArray(function(err, results) { 
      if(!err) {
          /*console.log(results.length);
          for(var i = 0; i < results.length; i++) {
            console.log(results[i]);
          }*/
          res.json(results);
      }
      else {
          res.send(err);
          db.close();
      }
    });
  });
});

router.get('/review/:from/:to', jsonParser, function (req, res) {          
    mongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db("amazon");  
      var collection = dbo.collection('reviews');
      var from = new Date(`${req.params.from}`);
      var to = new Date(`${req.params.to}`);
  
      collection.aggregate([
        { $limit : 1000000 },
        {
            $match:
                { "review.date" : { $gte : from, $lte : to } } 
        }, 
        { 
            $group: 
            { 
                _id: null, 
                avgStars: { $avg : "$review.star_rating" } 
            } 
        } 
]).toArray(function(err, results) { 
        // callback arguments are err or an array of results
      if(!err) {
  
          console.log(results.length);
  
          for(var i = 0; i < results.length; i++) {
  
            console.log(results[i]);
          }
  
          res.json(results);
      }
  
      else {
          res.send(err);
          db.close();
      }
    });
  });
});

router.get('/review/info/:custid', jsonParser, function (req, res) {          

    mongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
      if (err) throw err;
      var dbo = db.db("amazon");  
      var collection = dbo.collection('reviews');
      collection.aggregate([
        /*{ $limit : 1000000 }, */
        {
            $match: { customer_id : `${req.params.custid}` } 
        }, 
        { 
            $group: 
            { 
                _id: null, 
                avgStars: { $avg : "$review.star_rating" }, 
                avgHelpfulVotes: { $avg : "$votes.helpful_votes" },
                avgTotalVotes: { $avg : "$votes.total_votes" }
            } 
        } 
]).toArray(function(err, results) { 
      if(!err) {
          /*console.log("YEP");
          for(var i = 0; i < results.length; i++) {
            console.log(results[i]);
          }*/
          res.json(results);
      }
  
      else {
        res.send(err);
        db.close();
      }
    });
  });
});

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("CIS 445 server listening at", addr.address + ":" + addr.port);
});

