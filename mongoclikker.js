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

/**
 * Set hostname for connection
 * @param string host hostname
 * @return object mongoclikker
 * */
var funcSetHost = function(host) {
  mongoclikkerConnection.host = host;
  return this;
};

/**
 * Set port for connection
 * @param integer port port
 * @return object mongoclikker
 * */
var funcAndPort = function(port) {
  mongoclikkerConnection.port = port;
  return this;
};

/**
 * Set username for connection
 * @param string user username
 * @return object mongoclikker
 * */
var funcWithUser = function(user) {
  mongoclikkerConnection.user = user;
  return this;
};

/**
 * Set password for connection
 * @param string password password
 * @return object mongoclikker
 * */
var funcAndPassword = function(password) {
  mongoclikkerConnection.pass = password
  return this;
};

/**
 * Set database name for connection
 * @param string database database name
 * @return object mongoclikker
 * */
var funcforDatabase = function(database) {
  mongoclikkerConnection.db = database;
  return this;
};

/**
 * Set port for web interface
 * @param integer port web interface listens on (Default: 2002)
 * @return object mongoclikker
 * */
var funcAndListenOn = function(port) {
  mongoclikkerConnection.web = port;
  
  funcStartMongoclikker();
};

/**
 * Protect mongoclikker with HTTP Authentication. 
 * @param string user username
 * @param string pass password
 * @return object mongoclikker
 * */
var funcProtectWithUser = function(user, pass) {
  if (!pass || pass == '') {
    throw new Error("Missing password! Mongoclikker has to be started with user and password to avoid external abuse");
  } 
  
  mongoclikkerConnection.auth.user = user;
  mongoclikkerConnection.auth.pass = pass;
  
  return this;
};

/**
 * End mongoclikker interface response
 * @param object res response object
 * */
function endResponse(res) {
  res.write('</html>');
  res.end();
}

/**
 * Try to cast data received from update call
 * @param string data input
 * @return mixed casted output
 * */
function castData(data) {
  var tmpInt = data*1;
  
  if (data == '') {
    return ''; }
  if (data == 'null') {
    return null; }
  if (tmpInt == data) {
    return tmpInt; }
  if (data == 'false') {
    return false; }
  if (data == 'true') {
    return true; }
  return data;
}

/**
 * Get type of given data
 * @param mixed data input
 * @return string type
 * */
function typeOf(data){
  var type = typeof data;
	if (type !== 'object') {
		return type;
	} else if (Object.prototype.toString.call(data) === '[object Array]') {
		return 'array';
	} else if (data === null) {
		return 'null';
	} else {
    if (data instanceof Date) { return 'date'; }
		return 'object';
	}
}

/**
 * Check if given string has mongodb object id format 
 * @param string data input
 * @return boolean
 * */
function isID(data) {
  return (data.length == 12 || data.length == 24);
}

/**
 * Check if edit is supported for given data 
 * @param mixed value data to be displayed
 * @return boolean is editible?
 * */
function canEditValue(value) {
  var curType = typeOf(value);
  return !(curType == 'array' || curType == 'object');
}

/**
 * Display property value in interface 
 * @param mixed data data to be displayed
 * @param string path absolute path for url
 * @param integer index for array values
 * @param object params HTTP params from request
 * @return string styled value ready for output
 * */
var displayValue = function(data, path, index, params) {
  var curType     = typeOf(data);
  var curValue    = data;
  var curDisplay  = '';
  
  if (curType == 'array') {
    var curLength = curValue.length;
    curDisplay = '<table class="array">';
    for (var i = 0; i < curLength; i++) {
      curDisplay += '<tr><td class="desc key noRightMargin">' + (typeOf(data[i]) == 'array' ? '+' : '-') + ' </td><td class="content value subValue"  id="">' + displayValue(data[i], path, i, params) + '</td></tr>';
    }
    curDisplay += '</table>';
  } else if (curType == 'date') {
    curDisplay = curValue;
  } else if (curType == 'object') {
    var hasHeadline = false;
    if (curValue._id && curValue.name) {
      hasHeadline = '<a href="' + path + curValue._id + '">' + curValue.name + ' (#' + curValue._id + ')</a><br />';
    } else if (curValue._id) {
      hasHeadline = '<a href="' + path + curValue._id + '">' + curValue._id + '</a><br />';
    } else if (curValue.name) {
      hasHeadline = '<a href="">' + curValue.name + '</a><br />';
    }

    var curDisplay = hasHeadline || '';
    var objString = curValue.toString();
    if (isID(objString)) {
      curDisplay += '<a href="">' + objString + '</a>';
    } else {
      var styleString = 'display:none;';
      if (!hasHeadline || hasHeadline && params.subID && params.subID == curValue._id) {
        styleString = ''; }

      var curID = '1';
      var curCanEdit = canEditValue(curValue);
      curDisplay += '<table style="' + styleString + '" class="array">';
      var count = 0;
      for (var key in curValue) {
        var curKey = key;
        var curType = typeOf(curValue[key]);
        if (curType == 'array') {
          var curLength = curValue[key].length;
          curKey        = curKey + ' [' + curLength + ']';
        }
        curDisplay += '<tr><td class="desc key">' + curKey + ':</td><td class="content value propValue ' + (curCanEdit ? 'canEdit' : '') + '" id="' + curID + '">' + displayValue(curValue[key], path, index, params) + '</td></tr>';
      }
      curDisplay += '</table>';
    }
  } else {
    curDisplay = curValue;
  }
  
  return curDisplay;
};

/**
 * Start mongoclikker
 * */
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
  app.use(express.static(__dirname + '/static'));
  
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
        var dataType  = tmpProp.pop();
        
        updateSet[updateKey] = castData(newData, dataType);
        
        res.write(updateSet[updateKey] + "");
        res.end();
        
        if (tmpProp[4] && tmpProp[5]) {
          /**
           * Update sub document 
           * */
          /*
          var subKey = tmpProp[3] + '._id';
          objectFind[subKey] = tmpProp[4];
          if (tmpProp[4].length == 12 || tmpProp[4].length == 24) { 
            objectFind[subKey] = new BSON.ObjectID(tmpProp[4]); }
          var updateSubKey = tmpProp[3] + '.$.' + tmpProp[5];
          var updateSet = {};
          updateSet[updateSubKey] = newData;
          */
        } 
        
        collection.update(objectFind, {$set: updateSet}, {safe:true},
          function(err) {
            if (err) console.warn(err.message);
          }
        );
      });      
    });
  });
  
  /**
   * Handle database access
   * */
  app.get(viewURL + ':curDB?/:curCollection?/:curStart?/:curLimit?/:curDocument?/:curKey?/:subID?', function(req, res, next) {
    res.write('<html><head><title>mongoclikker</title><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/><script src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js"></script><script src="/script.js"></script><style>@import url("http://fonts.googleapis.com/css?family=Varela+Round&v2");</style><link rel="stylesheet/less" type="text/css" href="/styles.less"><script src="/less.js" type="text/javascript"></script></head>');
  
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
                      path += req.params.curDocument + '/';
                      for (var n in results[0]) { 
                        /**
                         * Display document properties
                         * */
                        var curValue = results[0][n];
                        var curType = typeOf(curValue);
                        var curID   = dbName + '__' + req.params.curCollection + '__' + req.params.curDocument + '__' + n + '__' + curType;
                        var curCanEdit = canEditValue(curValue);
                        var curKey = n;
                        
                        if (curType == 'array') {
                          var curLength = curValue.length;
                          curKey        = curKey + ' [' + curLength + ']';
                        }
                        
                        curValue = displayValue(curValue, path + n + '/', 0, req.params);
                        res.write('<tr><td class="desc key">' + curKey + '</td><td class="content value propValue ' + (curCanEdit ? 'canEdit' : '') + '" id="' + curID + '">' + curValue + '</td></tr>'); 
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
  console.log('Listening on port ' + mongoclikkerConnection.web);
};

exports.setHost = funcSetHost;
exports.protectWith = funcProtectWithUser;
exports.andPort = funcAndPort;
exports.withUser = funcWithUser;
exports.andPassword = funcAndPassword;
exports.forDatabase = funcforDatabase;
exports.andListenOn = exports.listenOn = funcAndListenOn;
exports.cast = castData;