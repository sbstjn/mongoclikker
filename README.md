# mongoclikker

[MongoDB](http://mongodb.org) viewer written in [Node](http://nodejs.org). Just clone, run `git submodule update --init` and fire up [mongoclikker](https://github.com/semu/mongoclikker) with 

    [sudo] node mongoclikker.js

Open [http://localhost:2002/view/DATABASE](http://localhost:2002/view/DATABASE) in your web borwser and your good to go…

![mongoclikker](http://img.hazelco.de/mongoclikker-20110728-192528.jpg)

## dependencies

mongoclikker uses [mustache](http://mustache.github.com/) for rendering some HTML code. mustache will be replaced in the future, it has been used for testing purposes :)

    git submodule init
    git submodule update

    npm install express mongodb

## configure

See `mongoclikker.js` for setting a default database and mongodb connection. Default settings should work fine for getting connected to your mongodb server, but they enable **public web access to your databases** while mongoclikker is running!

    var defaultDatabase = 'mongoclikker';
    var defaultHostname = 'localhost';
    var defaultPort     = '27017';