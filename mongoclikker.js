var mongoclickkerConnection = {
  host    : 'localhost'
, port    : '27017'
, user    : ''
, pass    : ''
, db      : 'mongoclikker'
, web     : '2002'
};


var funcSetHost = function(host) {
  mongoclickkerConnection.host = host;

  return this;
}

var funcAndPort = function(port) {
  mongoclickkerConnection.port = port;

  return this;
}

var funcWithUser = function(user) {
  mongoclickkerConnection.user = user;
  
  return this;
}

var funcAndPassword = function(password) {
  mongoclickkerConnection.pass = password
  
  return this;
}

var funcforDatabase = function(database) {
  mongoclickkerConnection.db = database;

  return this;
}

var funcAndListenOn = function(port) {
  mongoclickkerConnection.web = port;
  
  funcStartMongoclikker();
}

function endResponse(res) {
  res.write('</html>');
  res.end();
}

var funcStartMongoclikker = function() {
  var app = require('express').createServer();
  var Db = require('mongodb').Db,
      Connection = require('mongodb').Connection,
      Server = require('mongodb').Server,
      BSON = require('mongodb').BSONNative,
      connectionSettings = {native_parser:true};
  var viewURL = '/view/';
  
  if (BSON == null) {
    // no native support, fall back to pure mode
    BSON = require('mongodb').BSONPure;
    connectionSettings = {};
  }
  
  var currentDatabase = mongoclickkerConnection.db;
  var currentHostname = mongoclickkerConnection.host;
  var currentPort     = mongoclickkerConnection.port;
  
  app.get('/style.css', function(req, res) {
    res.end("@import url('http://fonts.googleapis.com/css?family=Varela+Round&v2'); body { background-color: #EEEEEE; color: #36393D; font-family: 'Varela Round', sans-serif; font-size: 12px; font-weight: normal; margin: 30px; } a { text-decoration: none; color: #bf1010; } a:hover { text-decoration: underline; } .desc { font-weight: bold; vertical-align: top; font-size: 14px; font-weight: normal; } .content { font-size: 14px; font-weight: normal; padding-left: 25px; } .content ul { list-style-type: none; margin: 0; padding: 0; } .content ul li { margin: 0; padding: 0; } .docsNav { font-size: 14px; font-weight: normal; } .docsNav td { padding-top: 15px; padding-bottom: 25px; } .key { color: #999; } tr:hover .key { color: #36393D; }");
  });
  
  app.get('/', function(req, res) {
    res.redirect(viewURL);
  });
  
  app.get(viewURL + ':curDB?/:curCollection?/:curStart?/:curLimit?/:curDocument?', function(req, res, next) {
    res.write('<html><head><title>mongoclikker</title><link rel="stylesheet" href="/style.css"></head>');
  
    // don't know how to get `show dbs` with node yet, so start with one datebase
    var dbName = req.params.curDB || currentDatabase;
    var listDB = [dbName];
  
    var db = new Db(dbName, new Server(currentHostname, currentPort, {}), connectionSettings);
    var path = viewURL;
    
    res.write('<table><tr><td class="desc">database</td><td class="content"><ul id="db">');
    for (var i = 0; i < listDB.length; i++) { res.write('<li><a href="' + path + listDB[i] + '">' + listDB + '</a></li>') }
    res.write('</ul></td></tr>');

    if (!req.params.curDB) {
      endResponse(res);
    } else {
      // db selected
      path += req.params.curDB + '/';
      db.open(function(err, ignored) {
        if (err) {
          console.log(err); }
        db.collectionNames(function(err, names) {
          var colItems = new Array();
          res.write('<tr><td class="desc">collection</td><td class="content"><ul id="collection">');
          for (var i = 0; i < names.length; i++) {
            var tmp = names[i].name.replace(req.params.curDB + '.', '');
            if (tmp.indexOf('.indexes') == -1) { 
              res.write('<li><a href="' + path + tmp + '/0/20">' + tmp + '</a></li>'); }
          }
          
          if (!req.params.curCollection) {
            endResponse(res);
          } else {
            // collection selected
            path += req.params.curCollection + '/' + req.params.curStart + '/' + req.params.curLimit + '/';
            var db = new Db(dbName, new Server(currentHostname, currentPort, {}), connectionSettings);
            db.open(function(err, db) {
              db.collection(req.params.curCollection, function(err, collection) {
                collection.find({}, {'skip':req.params.curStart, 'limit':req.params.curLimit}).toArray(function(err, results) {
                  res.write('<tr><td class="desc">item</td><td class="content"><ul id="documents">');
                  for (var i = 0; i < results.length; i++) { 
                    if (results[i]) { res.write('<li><a href="' + path + results[i]._id + '">' + (results[i].name && typeof(results[i].name) == 'string' ? results[i].name + ' (#' + results[i]._id + ')' : results[i]._id) + '</a></li>'); } }
                  res.write('</ul></td></tr>');;
                  var prevStart = (req.params.curStart*1 - 1*req.params.curLimit);
                  if (prevStart < 0) { 
                    prevStart = 0;  }
                  if (req.params.curDocument) { 
                    selectedItem = '/' + req.params.curDocument; }
                  
                  var selectedItem  = '';
                  var baseURL       = viewURL + req.params.curDB + '/' + req.params.curCollection + '/';                      
                  var nextURL       = baseURL + (req.params.curStart*1 + 1*req.params.curLimit) + '/' + req.params.curLimit + selectedItem;
                  var prevURL       = baseURL + prevStart + '/' + req.params.curLimit + selectedItem;
                  res.write('<tr class="docsNav"><td class="desc"></td><td class="content">');
                  
                  if (req.params.curStart > 0) { 
                    res.write('<a href="' + prevURL + '">prev</a> | '); }
                  res.write('<a href="' + nextURL + '">next</a></td></tr>');
                  
                  if (!req.params.curDocument) {
                    res.write('</table>');
                    endResponse(res); 
                  } else {
                    // document selected
                    var db = new Db(dbName, new Server(currentHostname, currentPort, {}), connectionSettings);
                    db.open(function(err, db) {
                      db.collection(req.params.curCollection, function(err, collection2) {
                        params = {'_id': req.params.curDocument};
                        if (req.params.curDocument.length == 12 || req.params.curDocument.length == 24) { 
                          params = {'_id': new  BSON.ObjectID(req.params.curDocument)}; }
                        collection.find(params).toArray(function(err, results) {
                          for (var n in results[0]) { 
                            res.write('<tr><td class="desc key">' + n + '</td><td class="content value">' + results[0][n] + '</td></tr>'); }
                          res.write('</table>');
                          endResponse(res); 
                        });
                      });
                    });
                  }
                });
              });
            });
          }
        });
      });
    }
  });
    
  app.listen(mongoclickkerConnection.web);
  console.log('Listening on http://localhost:' + mongoclickkerConnection.web + ':' + viewURL);
}

exports.setHost = funcSetHost;
exports.andPort = funcAndPort;
exports.withUser = funcWithUser;
exports.andPassword = funcAndPassword;
exports.forDatabase = funcforDatabase;
exports.andListenOn = exports.listenOn = funcAndListenOn;