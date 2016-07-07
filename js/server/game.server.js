var game_server = module.exports = {
        games: {},
        game_count: 0,
    },
    UUID        = require('node-uuid'),
    MainLoop    = require(__base + 'js/lib/MainLoop.js/build/mainloop.min.js'),
    verbose     = true;

// Include some values to handle sharing code with the browser
global.window = global.document = global;
global.MainLoop = MainLoop;

// Import shared game library code
require(__base + 'js/common/game.core.js');
require(__base + 'js/common/game.weapons.js');
require(__base + 'js/common/game.avatar.js');


// Simple wrapper for logging
game_server.log = function( log_message ) {
    if ( verbose )
        console.log('\t :: Server\t:: ' + log_message);
};



// Used for lag simulation
game_server.fake_latency = 0;
// Local queue of messages we delay if faking latency
game_server.messages = [];



game_server.step = function( game ) {
    
    return function( timestamp, delta ) {

        game.server_time = timestamp;

        for ( var playerid in game.core.avatars ) {
        
            var avatar = game.core.avatars[playerid];

            var input_vector = game.core.process_input( avatar );
            
            avatar.move_along( input_vector.movement.forward, input_vector.movement.right );

            if ( input_vector.mouse.x !== null && input_vector.y !== null )
                avatar.look_at( input_vector.mouse );

        }

    };

};

game_server.update = function( game ) {

    return function( dt ) {
        
        snapshot = {
            ps: {},
            t: game.server_time,
        };

        for ( var playerid in game.core.avatars ) {
            var avatar = game.core.avatars[playerid];

            avatar.update( dt );

            snapshot.ps[playerid] = {
                p: avatar.position,
                o: avatar.orientation,
                h: avatar.health,
                is: avatar.last_input_seq,
            };

        }

        for ( var playerid in game.players )
            game.players[playerid].emit( 'serverupdate', snapshot );

    };

};



game_server.createGame = function() {

    var game = {
        id: UUID(),
        players: {},
        player_count: 0,

        active: false,
    };

    this.games[game.id] = game;
    this.game_count++;

    game.core = new game_core( game );

    MainLoop.setBegin( game_server.step( game ).bind(this) )
            .setUpdate( game_server.update( game ).bind(this) ).start();

    this.log('Game created with id ' + game.id);

    this.startGame(game);

    return game;

};

game_server.startGame = function( game ) {

    game.active = true;

};

game_server.endGame = function( game ) {

    MainLoop.stop();

    for (var playerid in this.players) {

        // Tell each player the game is over
        var player = this.players[playerid];

        player.send('s.e.');

    }

    game.active = false;
    
};

game_server.destroyGame = function( game ) {

    delete this.games[game.id];
    this.game_count--;

    this.log('Game removed with id ' + game.id);

};

game_server.findGame = function( player ) {

    this.log( 'Player with id ' + player.id + ' looking for a game. We have ' + this.game_count + ' games');

    if (!this.game_count)
        this.createGame();

    for (var gameid in this.games) {

        var game = this.games[gameid];

        if (!game.active)
            continue;

        if (this.joinGame(game, player))
            return; // Stop searching for a game if we have succesfully joined this one

    }

    // No active game found, create a new one
    this.joinGame( this.createGame(), player);

};

game_server.joinGame = function( game, player ) {

    this.log( 'Player with id ' + player.id + ' is joining game with id ' + game.id);

    game.players[player.id] = player;
    game.player_count++;
    
    // Add to the game core (adds an avatar for the player)
    var avatar = game.core.add_avatar(player);

    // Set avatar spawn position
    avatar.set_position( 
            Math.round( Math.random() * game.core.world.width ),
            Math.round( Math.random() * game.core.world.height )
    );

    player.game = game;
    
    for ( playerid in game.players )
        game.players[playerid].emit( 'playerinfo', game_server.player_info( game ) );

    return true;

};

game_server.leaveGame = function( player ) {

    for ( gameid in this.games ) {
        
        var game = this.games[gameid];

        if ( game.players[player.id] ) {
    
            this.log( 'Player with id ' + player.id + ' is leaving game with id ' + game.id );
    
            delete game.players[player.id];
            game.player_count--;
    
            for ( playerid in game.players )
                game.players[playerid].emit( 'playerinfo', game_server.player_info( game ) );

        }

        game.core.remove_avatar( player );

    }
    
    return true;

};


game_server.onMessage = function( client, message ) {

    // If the client requested lag simulation, delay input messages 
    if ( game_server.fake_latency && message.split( '.' )[0].substr( 0, 1 ) == 'i' ) {

        game_server.messages.push({
            client: client,
            message: message
        });

        // Wait for the simulated lag to expire, then send the messages to the
        // actual handler function
        setTimeout(function() {
            if (game_server.messages.length) {
                this._onMessage( game_server.messages[0].client, game_server.messages[0].message );
                game_server.messages.splice( 0, 1 );
            }
        }.bind( this ), game_server.fake_latency );

    } else {

        this._onMessage( client, message );

    }

};

game_server._onMessage = function( client, message ) {
    
    var message_parts = message.split('.');

    var message_type = message_parts[0];

    // Client input message
    if ( message_type == 'i' )
        this.onInput( client, message_parts );

    // Ping request message
    else if ( message_type == 'p' )
        client.send('s.p.' + message_parts[1]);

    // Lag simulation request message
    else if ( message_type == 'l' )
        game_server.fake_latency = parseFloat( message_parts[1] );

};

game_server.onInput = function( client, parts ) {

    var input_commands = parts[1].replace( /\,/g, '.' ).split( '-' );
    var input_time = parts[2].replace('-', '.');
    var input_seq = parts[3];

    if ( client && client.game && client.game.core ) {
        
        this.games[client.game.id].core.avatars[client.userid].inputs.push({
            inputs: input_commands,
            time: input_time,
            seq: input_seq,
        });

    }

};



game_server.player_info = function( game ) {

    players = [];
    for ( playerid in game.players )
        players.push( playerid );

    return players;

};
