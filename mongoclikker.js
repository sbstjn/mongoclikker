/**
 * Default mongoclikker connection settings
 * */
var mongoclikkerConnection = {
  host    : 'localhost'
, port    : '27017'
, user    : ''
, pass    : ''
, db      : 'mongoclikker'
, web     : '2002'
, auth    : {
    user  : ''
  , pass  : ''
  }
};

var funcSetHost = function(host) {
  mongoclikkerConnection.host = host;

  return this;
};

var funcAndPort = function(port) {
  mongoclikkerConnection.port = port;

  return this;
};

var funcWithUser = function(user) {
  mongoclikkerConnection.user = user;
  
  return this;
};

var funcAndPassword = function(password) {
  mongoclikkerConnection.pass = password
  
  return this;
};

var funcforDatabase = function(database) {
  mongoclikkerConnection.db = database;

  return this;
};

var funcAndListenOn = function(port) {
  mongoclikkerConnection.web = port;
  
  funcStartMongoclikker();
};

var funcProtectWithUser = function(user, pass) {
  if (!pass || pass == '') {
    throw new Error("Missing password! Mongoclikker has to be started with user and password to avoid external abuse");
  } 
  
  mongoclikkerConnection.auth.user = user;
  mongoclikkerConnection.auth.pass = pass;
  
  return this;
};

function endResponse(res) {
  res.write('</html>');
  res.end();
}

var funcStartMongoclikker = function() {
  var app = require('express').createServer()
    , express = require('express')
    , Db = require('mongodb').Db
    , Connection = require('mongodb').Connection
    , Server = require('mongodb').Server
    , BSON = require('mongodb').BSONNative
    , connectionSettings = {native_parser:true}
    , viewURL = '/view/'
    , ConnectAuth = require(__dirname + '/lib/semu-connect-basic-auth-c32ee11/lib/basicAuth');
  
  app.use(ConnectAuth(function (user, password) { return user === mongoclikkerConnection.auth.user && password == mongoclikkerConnection.auth.pass; })); 
  app.use(express.bodyParser());  
  
  if (BSON == null) {
    /**
     * Fallback for non-native BSON objects
     * */
    BSON = require('mongodb').BSONPure;
    connectionSettings = {};
  }
  
  var currentDatabase = mongoclikkerConnection.db
    , currentHostname = mongoclikkerConnection.host
    , currentPort     = mongoclikkerConnection.port;
  
  /**
   * Serve style.css file
   * */
  app.get('/style.css', function(req, res) {
    res.end("@import url('http://fonts.googleapis.com/css?family=Varela+Round&v2'); .canEdit { cursor: pointer; } .canEdit input { font-family: 'Varela Round', sans-serif; font-size: 14px; font-weight: normal; padding: 0 0 0 2px; margin: 0px; border: 0px; background-color: #CCC; } body { background-color: #EEEEEE; color: #36393D; font-family: 'Varela Round', sans-serif; font-size: 12px; font-weight: normal; margin: 30px; } a { text-decoration: none; color: #bf1010; } a:hover { text-decoration: underline; } .desc { font-weight: bold; vertical-align: top; font-size: 14px; font-weight: normal; } .content { font-size: 14px; font-weight: normal; padding-left: 25px; } .content ul { list-style-type: none; margin: 0; padding: 0; } .content ul li { margin: 0; padding: 0; } .docsNav { font-size: 14px; font-weight: normal; } .docsNav td { padding-top: 15px; padding-bottom: 25px; } .key { color: #999; } tr:hover .key { color: #36393D; }");
  });
  
  /**
   * Load script.js from external file
   * */
  app.get('/script.js', function(req, res) {
    var fs = require('fs');
    fs.readFile(__dirname + '/script.js', function(error, content) {
      if (error) {
        res.writeHead(500);
        res.end(); }
      else {
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.end(content, 'utf-8'); }
    });
  });
  
  /**
   * Redirect / to viewURL
   * */
  app.get('/', function(req, res) {
    res.redirect(viewURL);
  });
  
  /**
   * Handle ajax update calls
   * */

  app.post('/update/*', function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    var newData = req.body.data;
    var tmpProp = req.url.replace('/update/', '').split('__');
    
    var objectFind = {'_id': tmpProp[2]};
    if (tmpProp[3].length == 12 || tmpProp[2].length == 24) { 
      objectFind = {'_id': new  BSON.ObjectID(tmpProp[2])}; }
    
    db = new Db(tmpProp[0], new Server(currentHostname, currentPort, {}), connectionSettings)
    db.open(function(err, ignored) {
      if (err) { throw new Error(err); }
      db.collection(tmpProp[1], function(err, collection) {
        var updateKey = tmpProp[3];
        var updateSet = {};
        updateSet[updateKey] = newData;
        
        if (tmpProp[4] && tmpProp[5]) {
          /**
           * Update sub document 
           * */
          var subKey = tmpProp[3] + '._id';
          objectFind[subKey] = tmpProp[4];
          if (tmpProp[4].length == 12 || tmpProp[4].length == 24) { 
            objectFind[subKey] = new BSON.ObjectID(tmpProp[4]); }
          var updateSubKey = tmpProp[3] + '.$.' + tmpProp[5];
          var updateSet = {};
          updateSet[updateSubKey] = newData;
        }
        
        collection.update(objectFind, {$set: updateSet}, {safe:true},
          function(err) {
            if (err) console.warn(err.message);
          }
        );
      });      
    });

    res.end();
  });
  
  /**
   * Handle database access
   * */
  app.get(viewURL + ':curDB?/:curCollection?/:curStart?/:curLimit?/:curDocument?/:curKey?/:subID?', function(req, res, next) {
    res.write('<html><head><title>mongoclikker</title><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/><script src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js"></script><script src="/script.js"></script><link rel="stylesheet" href="/style.css"></head>');
  
    /**
     * don't know how to get `show dbs` with node yet, so start with one datebase
     * */
    var dbName = req.params.curDB || currentDatabase
      , listDB = [dbName]
      , db = new Db(dbName, new Server(currentHostname, currentPort, {}), connectionSettings)
      , path = viewURL;
    
    res.write('<table><tr><td class="desc">database</td><td class="content"><ul id="db">');
    for (var i = 0; i < listDB.length; i++) { res.write('<li><a href="' + path + listDB[i] + '">' + listDB + '</a></li>'); }
    res.write('</ul></td></tr>');

    if (!req.params.curDB) {
      /**
       * No database selected
       * */
      endResponse(res);
    } else {
      /**
       * Selected database
       * */
      path += req.params.curDB + '/';
      db.open(function(err, ignored) {
        if (err) { console.log(err); }
        db.collectionNames(function(err, names) {
          var colItems = [];
          res.write('<tr><td class="desc">collection</td><td class="content"><ul id="collection">');
          for (var i = 0; i < names.length; i++) {
            var tmp = names[i].name.replace(req.params.curDB + '.', '');
            if (tmp.indexOf('.indexes') == -1) { 
              res.write('<li><a href="' + path + tmp + '/0/20">' + tmp + '</a></li>'); }
          }
          
          if (!req.params.curCollection) {
            /**
             * No collection selected
             * */
            endResponse(res);
          } else {
            /**
             * Selected collection
             * */
            path += req.params.curCollection + '/' + req.params.curStart + '/' + req.params.curLimit + '/';
            db.collection(req.params.curCollection, function(err, collection) {
              collection.find({}, {'skip':req.params.curStart, 'limit':req.params.curLimit}).toArray(function(err, results) {
                res.write('<tr><td class="desc">item</td><td class="content"><ul id="documents">');
                for (var i = 0; i < results.length; i++) { 
                  if (results[i]) { res.write('<li><a href="' + path + results[i]._id + '">' + (results[i].name && typeof(results[i].name) == 'string' ? results[i].name + ' (#' + results[i]._id + ')' : results[i]._id) + '</a></li>'); } }
                res.write('</ul></td></tr>');
                var prevStart = (req.params.curStart*1 - 1*req.params.curLimit);
                if (prevStart < 0) { 
                  prevStart = 0;  }
                if (req.params.curDocument) { 
                  selectedItem = '/' + req.params.curDocument; }
                
                /**
                 * Build navigation items
                 * */
                var selectedItem = ''
                  , baseURL = viewURL + req.params.curDB + '/' + req.params.curCollection + '/'
                  , nextURL = baseURL + (req.params.curStart*1 + 1*req.params.curLimit) + '/' + req.params.curLimit + selectedItem
                  , prevURL = baseURL + prevStart + '/' + req.params.curLimit + selectedItem;
                res.write('<tr class="docsNav"><td class="desc"></td><td class="content">');
                if (req.params.curStart > 0) { 
                  res.write('<a href="' + prevURL + '">prev</a> | '); }
                if (results.length >= req.params.curLimit) {
                  res.write('<a href="' + nextURL + '">next</a></td></tr>'); }  
                
                if (!req.params.curDocument) {
                  /**
                   * No selected document
                   * */
                  res.write('</table>');
                  endResponse(res); 
                } else {
                  /**
                   * Selected document
                   * */
                  db.collection(req.params.curCollection, function(err, collection2) {
                    params = {'_id': req.params.curDocument};
                    if (req.params.curDocument.length == 12 || req.params.curDocument.length == 24) { 
                      params = {'_id': new  BSON.ObjectID(req.params.curDocument)}; }
                    collection.find(params).toArray(function(err, results) {
                      for (var n in results[0]) { 
                        if (results[0][n] instanceof Array) {
                          /**
                           * Document has sub documents
                           * */
                          res.write('<tr><td class="desc key">' + n + '</td><td class="content value"><ul>');
                          for (var s in results[0][n]) {
                            var current0NSItem = results[0][n][s];
                            if (current0NSItem._id) {
                              if (current0NSItem.name) {
                                res.write('<li><a href="' + path + req.params.curDocument + '/' + n + '/' + current0NSItem._id + '">');
                                res.write(current0NSItem.name + ' (#' + current0NSItem._id + ')</a>'); }
                              else if (current0NSItem._id) {
                                res.write('<li><a href="' + path + req.params.curDocument + '/' + n + '/' + current0NSItem._id + '">');
                                res.write(current0NSItem._id + '</a>'); 
                              }
                             
                              if (req.params.subID && current0NSItem._id == req.params.subID) {
                                res.write('<table>');
                                for (var key in current0NSItem) {
                                  res.write('<tr><td class="desc key">' + key + '</td><td class="content value subValue canEdit"  id="' + dbName + '__' + req.params.curCollection + '__' + req.params.curDocument + '__' + n + '__' + current0NSItem._id + '__' + key + '">');
                                  res.write(current0NSItem[key] + '</td></tr>');
                                }
                                res.write('</table>');
                              }
                              res.write('</li>');
                            }
                          }
                          res.write('</ul></td></tr>');
                        } else {
                          /**
                           * Display simple document property
                           * */
                          res.write('<tr><td class="desc key">' + n + '</td><td class="content value propValue canEdit" id="' + dbName + '__' + req.params.curCollection + '__' + req.params.curDocument + '__' + n + '">' + results[0][n] + '</td></tr>'); 
                        }
                      }
                      res.write('</table>');
                      endResponse(res); 
                    });
                  });
                }
              });
            });
          }
        });
      });
    }
  });
  app.listen(mongoclikkerConnection.web);
  console.log('Listening on http://localhost:' + mongoclikkerConnection.web + ':' + viewURL);
};

exports.setHost = funcSetHost;
exports.protectWith = funcProtectWithUser;
exports.andPort = funcAndPort;
exports.withUser = funcWithUser;
exports.andPassword = funcAndPassword;
exports.forDatabase = funcforDatabase;
exports.andListenOn = exports.listenOn = funcAndListenOn;