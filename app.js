var mongoclikker = require('./mongoclikker.js');

mongoclikker/*.setHost('localhost')
            .andPort(27017)
            .forDatabase('mongoclikker') */
            .protectWith('mongo', 'clikker') /* Set password for HTTP Access Authorization! Not MongoDB password! */
            .andListenOn(2002);
