require('./mongoclikker.js')/*.setHost('localhost')
            .andPort(27017)
            .forDatabase('mongoclikker') */
            .protectWith('mongo', 'clikker') /* Password for HTTP Authorization! */
            .listenOn(2002);