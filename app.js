const app = require('express')(),
    bodyParser = require('body-parser'),
    steam = require('steam'),
    csgo = require('csgo'),
    steamClient = new steam.SteamClient(),
    steamUser = new steam.SteamUser(steamClient),
    steamFriends = new steam.SteamFriends(steamClient),
    steamGC = new steam.SteamGameCoordinator(steamClient, 730),
    csgoClient = new csgo.CSGOClient(steamUser, steamGC, false);

var logOnDetails = {
    account_name: '...',
    password: '...'
};

/**
 * Connect callback.
 */
steamClient.on('connected', response => {
    console.log('[steam] connected');

    /**
     * Logon to Steam.
     */
    steamUser.logOn(logOnDetails);
});

/**
 * Logon callback.
 */
steamClient.on('logOnResponse', response => {
    /**
     * If the logon failed.
     */
    if (response.eresult != steam.EResult.OK) {
        console.log('[steam] login failed: %s', response);
        process.exit();
    }
    console.log('[steam] logged in as %s successfully', logOnDetails['account_name']);

    /**
     * Set the account status to online.
     */
    steamFriends.setPersonaState(steam.EPersonaState.Online);

    /**
     * Launch the CS:GO client.
     */
    csgoClient.launch();
    csgoClient.on('ready', () => {
        console.log('[csgo] client is ready');
    });
});
steamClient.connect();

app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/frontend.html');
});

app.post('/api', (req, res) => {
    /**
     * If the inspect URL is not given.
     */
    if (!('inspect' in req.body)) {
        return res.end(JSON.stringify({
            status: 'error',
            message: 'No inspect URL given.'
        }));
    }

    /**
     * Validate the inspect URL.
     */
    var groups = /([SM])(\d+)A(\d+)D(\d+)/.exec(req.body.inspect);
    var s, m, a, d;
    if (!groups) {
        return res.end(JSON.stringify({
            status: 'error',
            message: 'Invalid inspect URL given.'
        }));
    }

    /**
     * Do... stuff?
     */
    if (groups[1] === 'S') {
        s = groups[2];
        m = '0';
    } else if (groups[1] === 'M') {
        m = groups[2];
        s = '0';
    }

    a = groups[3];
    d = groups[4];

    /**
     * Request the item data.
     */
    csgoClient.itemDataRequest(s, a, d, m);
    csgoClient.on('itemData', itemdata => {
        return res.end(JSON.stringify({
            status: 'success',
            message: JSON.stringify(itemdata, null, 2)
        }));
    });
});

app.listen(3000);
console.log('[http] listening on %d', 3000);
