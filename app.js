var express = require('express'), 
app = express.createServer();

app.get('/', function(req, res){
  res.send('Welcome to <a href="http://lucian.HAZELno.de/">lucian.HAZELno.de</a>');
});

console.log('Listening on http://lucian.HAZELno.de/');
app.listen(8007);