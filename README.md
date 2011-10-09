# mongoclikker

A clean [MongoDB](http://mongodb.org) viewer and basic editor written in [Node](http://nodejs.org). Just clone or download mongoclikker, run `npm install` and fire up [mongoclikker](https://github.com/semu/mongoclikker) with 

    [sudo] node app.js

Open [http://HOSTNAME:2002/view/DATABASE](http://HOSTNAME:2002/view/DATABASE) in your web browser and you are good to go…

![mongoclikker](http://img.hazelco.de/mongoclikker.jpg)

## Security

Per default mongoclikker is protected with a basic HTTP authentication, you should change the default password set in `app.js`:

    app.js:4 protectWith('mongo', 'clikker')

## Edit Mode

[mongoclikker](https://github.com/semu/mongoclikker) supports simple inline edit for basic document properties. 

## Configure

See `app.js` for setting a default database and mongodb connection. Default settings should work fine for getting connected to your local mongodb server. [mongoclikker](https://github.com/semu/mongoclikker) is protected with a simple HTTP access control, read and write access cannot be done without propper authentication.

    require('./mongoclikker.js')/*.setHost('localhost')
            .andPort(27017)
            .forDatabase('mongoclikker') */
            .protectWith('mongo', 'clikker') /* Password for HTTP Authorization */
            .listenOn(2002);
    
## Database Design

[mongoclikker](https://github.com/semu/mongoclikker) works best with documents having an `_id` and a `name` property, included sub documents in arrays or properties should be designed the same way. Of course [mongoclikker](https://github.com/semu/mongoclikker) works fine for collections and databases with different designs!
