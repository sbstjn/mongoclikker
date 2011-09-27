# mongoclikker

A clean [MongoDB](http://mongodb.org) viewer and basic editor written in [Node](http://nodejs.org). Just clone, run `npm install` and fire up [mongoclikker](https://github.com/semu/mongoclikker) with 

    [sudo] node app.js

Open [http://HOSTNAME:2002/view/DATABASE](http://HOSTNAME:2002/view/DATABASE) in your web browser and your good to go…

![mongoclikker](http://img.hazelco.de/mongoclikker-20110728-192528.jpg)

## Security

Per default mongoclikker is protected with a basic HTTP authentication, you should change the default password set in `app.js`:

    app.js:4 protectWith('mongo', 'clikker')

## configure

See `app.js` for setting a default database and mongodb connection. Default settings should work fine for getting connected to your local mongodb server. [mongoclikker](https://github.com/semu/mongoclikker) is protected with a simple HTTP access control, read and write access cannot be done without propper authentication.

    require('./mongoclikker.js')/*.setHost('localhost')
            .andPort(27017)
            .forDatabase('mongoclikker') */
            .protectWith('mongo', 'clikker') /* Password for HTTP Authorization */
            .listenOn(2002);
    
