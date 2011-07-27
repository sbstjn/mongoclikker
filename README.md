# mongoclikker

[MongoDB](http://mongodb.org) viewer written in [Node](http://nodejs.org). Just clone, run `git submodule update --init` and fire up [mongoclikker](https://github.com/semu/mongoclikker) with 

    [sudo] node mongoclikker.js

![mongoclikker](http://img.hazelco.de/mongoclikker-20110727-211717.jpg)

## dependencies

mongoclikker uses [mustache](http://mustache.github.com/) for rendering some HTML code. mustache will be replaced in the future, it was used for testing purposes…

    git submodule init
    git submodule update

    npm install express mongodb

## configure

See `mongoclikker.js` for setting a default database and mongodb connection. Defaults should be fine, but enable **public access to your database**! Use mongoclikker wisely…

    var defaultDatabase = 'mongoclikker';
    var defaultHostname = 'localhost';
    var defaultPort     = '27017';


