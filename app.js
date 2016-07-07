/*  Copyright 2012-2016 Sven "underscorediscovery" Bergström
    
    written by : http://underscorediscovery.ca
    written for : http://buildnewgames.com/real-time-multiplayer/
    
    MIT Licensed.

    Usage : node app.js
*/

global.__base = __dirname + '/';

    var
        gameport        = process.env.PORT || 4004,

        io              = require('socket.io'),
        express         = require('express'),
        UUID            = require('node-uuid'),

        verbose         = false,
        http            = require('http'),
        app             = express(),
        server          = http.createServer(app);

/* Express server set up. */

//The express server handles passing our content to the browser,
//As well as routing users where they need to go. This example is bare bones
//and will serve any file the user requests from the root of your web server (where you launch the script from)
//so keep this in mind - this is not a production script but a development teaching tool.

    //Tell the server to listen for incoming connections
    server.listen(gameport)

    //Log something so we know that it succeeded.
    console.log('\t :: Express\t:: Listening on port ' + gameport );

    //By default, we forward the / path to index.html automatically.
    app.get( '/', function( req, res ){
        res.sendfile( '/index.html' , { root:__dirname + '/html' });
    });


    //This handler will listen for requests on /*, any file from the root of our server.
    //See expressjs documentation for more info on routing.

    app.get( '/*' , function( req, res, next ) {

        //This is the current file they have requested
        var file = req.params[0];

        //For debugging, we can track what files are requested.
        if(verbose) console.log('\t :: Express\t:: file requested : ' + file);
        
        res.header( 'Cache-Control', 'private, no-cache, no-store, must-revalidate' );
        res.header( 'Expires', -1 );
        res.header( 'Pragme', 'no-cache' );

        //Send the requesting client the file.
        res.sendfile( __dirname + '/' + file );

    }); //app.get *


/* Socket.IO server set up. */

//Express and socket.io can work together to serve the socket.io client files for you.
//This way, when the client requests '/socket.io/' files, socket.io determines what the client needs.
        
    //Create a socket.io instance using our express server
    var sio = io.listen(server);

    //Configure the socket.io connection settings.
    //See http://socket.io/
    sio.use( function( socket, next ) {

        var handshakeData = socket.request;
        
        next();
    } );

    game_server = require(__base + 'js/server/game.server.js');

    sio.sockets.on('connection', function (player) {
        
        //Generate a new UUID, looks something like
        //5b2ca132-64bd-4513-99da-90e838ca47d1
        //and store this on their socket/connection
        player.id = UUID();
        player.userid = player.id;

        //tell the player they connected, giving them their id
        player.emit('connected', { id: player.userid } );

        //now we can find them a game to play with someone.
        //if no game exists with someone waiting, they create one and wait.
        game_server.findGame(player);

        //Useful to know when someone connects
        console.log('\t :: socket.io\t:: player ' + player.userid + ' connected');
        

        //Now we want to handle some of the messages that clients will send.
        //They send messages here, and we send them to the game_server to handle.
        player.on('message', function(m) {

            game_server.onMessage(player, m);

        }); //player.on message

        //When this client disconnects, we want to tell the game server
        //about that as well, so it can remove them from the game they are
        //in, and make sure the other player knows that they left and so on.
        player.on('disconnect', function () {

            game_server.leaveGame( player );

            //Useful to know when soomeone disconnects
            console.log('\t :: socket.io\t:: player ' + player.userid + ' disconnected');
            
        }); //player.on disconnect
     
    }); //sio.sockets.on connection
