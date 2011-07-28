# mongoclikker

[MongoDB](http://mongodb.org) viewer written in [Node](http://nodejs.org). Just clone, run `npm install express mongodb` and fire up [mongoclikker](https://github.com/semu/mongoclikker) with 

    [sudo] node app.js

Open [http://localhost:2002/view/DATABASE](http://localhost:2002/view/DATABASE) in your web borwser and your good to go…

![mongoclikker](http://img.hazelco.de/mongoclikker-20110728-192528.jpg)


## configure

See `app.js` for setting a default database and mongodb connection. Default settings should work fine for getting connected to your local mongodb server, but they enable **public web access to your databases** while mongoclikker is running!

    var mongoclikker = require('./mongoclikker.js');
    
    mongoclikker/*.setHost('localhost')
                .andPort(27017)
                .forDatabase('mongoclikker')
                */.andListenOn(2002);
    
