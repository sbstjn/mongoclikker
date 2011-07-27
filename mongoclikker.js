var app = require('express').createServer();
var Mongolian = require('mongolian');
var Mu = require('./vendor/Mu');
var Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server,
    BSON = require('mongodb').BSONNative;
var viewURL = '/view/';

var defaultDatabase = 'mongoclikker';
var defaultHostname = 'localhost';
var defaultPort     = '27017';

function endResponse(res) {
    res.write('</html>');
    res.end();
}

app.get('/style.css', function(req, res) {
  res.end("@import url('http://fonts.googleapis.com/css?family=Varela+Round&v2'); body { background-color: #EEEEEE; color: #36393D; font-family: 'Varela Round', sans-serif; font-size: 12px; font-weight: normal; margin: 30px; } a { text-decoration: none; color: #bf1010; } a:hover { text-decoration: underline; } .desc { font-weight: bold; vertical-align: top; font-size: 14px; font-weight: normal; } .content { font-size: 14px; font-weight: normal; padding-left: 25px; } .content ul { list-style-type: none; margin: 0; padding: 0; } .content ul li { margin: 0; padding: 0; } .docsNav { font-size: 14px; font-weight: normal; } .docsNav td { padding-top: 15px; padding-bottom: 25px; } .key { color: #999; } tr:hover .key { color: #36393D; }");
});

app.get('/', function(req, res) {
  res.redirect(viewURL);
});

app.get(viewURL + ':curDB?/:curCollection?/:curStart?/:curLimit?/:curDocument?', function(req, res, next) {
  res.write('<html><head><title>mongoclikker</title><link rel="stylesheet" href="/style.css"></head>');

  /* Don't know how to get `show dbs` with NodeJS yet, so start with one datebase */
  var dbName = req.params.curDB || defaultDatabase;
  var listDB = [dbName];

  var db = new Db(dbName, new Server(defaultHostname, defaultPort, {}), {native_parser:true});
  var path = viewURL;
  var dbItems = new Array();
  for (var i = 0; i < listDB.length; i++) {
    var tmp = {name: listDB[i]};
    if (req.params.curDB == listDB[i]) { tmp.isCurrent = true; }
    dbItems.push(tmp);
  }
  
  var compiled = Mu.compileText('<table><tr><td class="desc">database</td><td class="content"><ul id="db">' + 
                                '{{#items}}<li><a href="' + path + '{{name}}" {{#isCurrent}} class="current"{{/isCurrent}}>{{name}}</a></li>{{/items}}' + 
                                '</ul></td></tr>', {});
  compiled({items: dbItems}).addListener('data', function (dbSelection) { res.write(dbSelection); }).addListener('end', function() {
    if (!req.params.curDB) {
      endResponse(res);
    } else {
      /* Has DB selected */
      path += req.params.curDB + '/';
      db.open(function(err, ignored) {
        if (err) console.log(err);
        db.collectionNames(function(err, names) {
          var colItems = new Array();
          for (var i = 0; i < names.length; i++) {
            /* Parse collection list */
            var tmp = {name: names[i].name.replace(req.params.curDB + '.', '')};
            if (req.params.curCollection == tmp.name) { tmp.isCurrent = true; }              
            if (tmp.name.indexOf('.indexes') == -1) { colItems.push(tmp); }
          }
          
          var compiled = Mu.compileText('<tr><td class="desc">collection</td><td class="content"><ul id="collection">' + 
                                        '{{#items}}<li><a href="' + path + '{{name}}/0/20"{{#isCurrent}} class="current"{{/isCurrent}}>{{name}}</a></li>{{/items}}' + '</ul></td></tr>', {});
          compiled({items: colItems, path: path}).addListener('data', function (colSelection) { res.write(colSelection); }).addListener('end', function() {
            if (!req.params.curCollection) {
              endResponse(res);
            } else {
              /* Has Collection selected */
              path += req.params.curCollection + '/' + req.params.curStart + '/' + req.params.curLimit + '/';
              var db = new Db(dbName, new Server(defaultHostname, defaultPort, {}), {native_parser:true});
              db.open(function(err, db) {
                db.collection(req.params.curCollection, function(err, collection) {
                  collection.find({}, {'skip':req.params.curStart, 'limit':req.params.curLimit}).toArray(function(err, results) {
                    var docItems = new Array();
                    for (var i = 0; i < results.length; i++) {
                      if (results[i]) {
                        docItems.push(results[i]);
                      }
                    }
                    
                    var prevStart = (req.params.curStart*1 - 1*req.params.curLimit);
                    if (prevStart < 0) { prevStart = 0;  }
                    if (req.params.curDocument) { selectedItem = '/' + req.params.curDocument; }
                    
                    var selectedItem  = '';
                    var baseURL       = viewURL + req.params.curDB + '/' + req.params.curCollection + '/';                      
                    var nextURL       = baseURL + (req.params.curStart*1 + 1*req.params.curLimit) + '/' + req.params.curLimit + selectedItem;
                    var prevURL       = baseURL + prevStart + '/' + req.params.curLimit + selectedItem;
                    
                    var compiled = Mu.compileText('<tr><td class="desc">item</td><td class="content"><ul id="documents">' + 
                                                  '{{#items}}<li><a href="' + path + '{{_id}}"{{#isCurrent}} class="current"{{/isCurrent}}>{{_id}}</a></li>{{/items}}' + 
                                                  '</ul></td></tr><tr class="docsNav"><td class="desc"></td><td class="content"><a href="' + prevURL + '">prev</a> | <a href="' + nextURL + '">next</a></td></tr>', {});
                    compiled({items: docItems, path: path}).addListener('data', function (docSelection) { res.write(docSelection); }).addListener('end', function () { 
                      if (!req.params.curDocument) {
                        res.write('</table>');
                        endResponse(res); 
                      } else {
                        /* Selected Document */
                        var db = new Db(dbName, new Server(defaultHostname, defaultPort, {}), {native_parser:true});
                        db.open(function(err, db) {
                          db.collection(req.params.curCollection, function(err, collection2) {
                            collection.find({'_id': new BSON.ObjectID(req.params.curDocument)}).toArray(function(err, results) {
                              for (var n in results[0]) { res.write('<tr><td class="desc key">' + n + '</td><td class="content value">' + results[0][n] + '</td></tr>'); }
                              res.write('</table>');
                              endResponse(res); 
                            });
                          });
                        });
                      }
                    });
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

app.listen(2002); 
console.log('http://localhost:2002:/view/');