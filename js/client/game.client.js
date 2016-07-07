// The game_client class
var game_client = function( viewport ) {
    
    this.STATES = {
        connecting:     'connecting',
        connected:      'connected',
        disconnected:   'disconnected',
        not_connected:  'not-connected',
    }

    this.viewport_size = {
        width: 1280,
        height: 960,
    };

    this.DEBUG = true;

    this.state = this.STATES.not_connected;
    
    // Create the keyboard handler
    this.keyboard = new THREEx.KeyboardState();
    // Create a mouse handler
    this.mouse = {
        x: 0,
        y: 0,
        lmb_state: 'up',
        rmb_state: 'up',
        scroll: 0,
    };
    this.last_mouse_position = {}
    for ( attr in this.mouse )
        this.last_mouse_position[attr] = this.mouse[attr];
    // Sequence number of the last input received
    this.input_seq = 0;

    // This will be set by the server when we connect
    this.player_id = null;
    this.health_text = new createjs.Text("Health: ?/?", '30px Arial', '#ff7700' );
    this.health_text.x = 10;
    this.health_text.y = 10;

    // A list of sprites that should be updated on each draw cycle
    this.sprites = {};

    // A list of server updates for interpolation
    this.server_updates = [];
    this.max_update_buffer_size = 2;    // Seconds

};

game_client.prototype.handle_input = function( timestamp, delta ) {
    
    // This function takes input from the client and keeps a record
    // It sends the input information to the server immediately as it
    // is pressed and tags each input with a sequence number
    var input = [],
        avatar = game.avatars[this.player_id];
    
    if ( !avatar )
        return;

    if (this.keyboard.pressed('Q') || this.keyboard.pressed('left')) {
        
        input.push('l');

    }
    if (this.keyboard.pressed('D') || this.keyboard.pressed('right')) {

        input.push('r');

    }
    if (this.keyboard.pressed('S') || this.keyboard.pressed('down')) {

        input.push('d');

    }
    if (this.keyboard.pressed('Z') || this.keyboard.pressed('up')) {

        input.push('u');

    }
    if ( this.last_mouse_position.x != this.mouse.x || this.last_mouse_position.y != this.mouse.y ) {

        input.push( ( 'm|' + this.mouse.x.fixed(3) + '|' + this.mouse.y.fixed(3) ).replace( /\./g, ',' ) );
        this.last_mouse_position.x = this.mouse.x;
        this.last_mouse_position.y = this.mouse.y;

    }
    
    if ( this.last_mouse_position.lmb_state != this.mouse.lmb_state ) {
        
        input.push( 'm|l|' + this.mouse.lmb_state );
        this.last_mouse_position.lmb_state = this.mouse.lmb_state;

    }
    if ( this.last_mouse_position.rmb_state != this.mouse.rmb_state ) {
        
        input.push( 'm|r|' + this.mouse.rmb_state );
        this.last_mouse_position.rmb_state = this.mouse.rmb_state;

    }

    if (input.length) {
        
        this.input_seq += 1;
        
        if ( this.player_id && avatar )
            avatar.inputs.push({
                inputs: input,
                time: timestamp.fixed(3),
                seq: this.input_seq,
            });
        
        var server_packet = 'i.';
            server_packet += input.join('-') + '.';
            server_packet += timestamp.toFixed(3).replace('.', '-') + '.';
            server_packet += this.input_seq;

        this.socket.send( server_packet );

    }

    var input_vector = game.process_input( avatar );

    avatar.move_along( input_vector.movement.forward, input_vector.movement.right );

    if ( input_vector.mouse.x !== null && input_vector.mouse.y !== null )
        avatar.look_at( input_vector.mouse );

};

game_client.prototype.update = function( dt ) {
    
    if (this.player_id) {

        var avatar = game.avatars[this.player_id];

        avatar.update( dt );
        
        this.health_text.text = "Health: " + avatar.health + "/" + avatar.max_health;
        
    }

};

game_client.prototype.draw = function() {

    for (playerid in this.sprites) {
        
        var sprite = this.sprites[playerid];

        sprite.late_update();

        continue;

        var avatar = game.avatars[playerid];

        if ( !avatar.position )
            return;
       
        var img = assets.getResult( 'knife_idle_0' );
        var scale = avatar.sprite_height / img.height;
        
        this.surface.translate( avatar.position.x, avatar.position.y );
        this.surface.rotate( avatar.orientation );

        this.surface.drawImage( img, -img.height * scale / 2, -avatar.sprite_height / 2, img.width * scale, avatar.sprite_height );
        this.surface.rotate( -avatar.orientation );
        this.surface.translate( -avatar.position.x, -avatar.position.y );

    }

    stage.update( [] );

};



game_client.prototype.connect_to_server = function() {

    this.socket = io.connect();

    // When we connect, we are not 'connected' until we have a server id
    // and are placed in a game by the server. The server sends us a message
    // for that.
    this.socket.on( 'connect', function() {
        this.state = this.STATES.connecting;
    }.bind( this ) );

    // Sent when we are disconnected (network, server down, etc.)
    this.socket.on( 'disconnect', this.on_disconnect.bind( this ) );
    // On error we just show that we are not connected for now.
    this.socket.on( 'error', this.on_disconnect.bind( this ) );
    // On message from the server, we parse the commands and send it to the handlers
    this.socket.on( 'message', this.on_message.bind( this ) );
    // Sent each tick of the server simulation. This is our authorotive update
    this.socket.on( 'serverupdate', this.on_server_update.bind( this ) );
    // Sent when we actually connect to the server
    this.socket.on( 'connected', this.on_connected.bind( this ) );
    // Sent on connect or when a new players connects
    this.socket.on( 'playerinfo', this.on_player_info.bind( this ) );

};

game_client.prototype.on_connected = function( player ) {
    
    this.player_id = player.id;

    var player_avatar = game.add_avatar( player );
    this.add_sprite( this.player_id );

    this.state = this.STATES.connected;

    // Start listening to mouse events
    stage.on( 'stagemousemove', ( function( event ) {

        this.mouse.x = event.stageX;
        this.mouse.y = event.stageY;

    } ).bind( this ) );

    stage.on( 'stagemousedown', ( function( event ) {
        
        if ( event.nativeEvent.button == 0 ) {
            this.mouse.lmb_state = 'down';}
        else if ( event.nativeEvent.button == 2 )
            this.mouse.rmb_state = 'down';

    } ).bind( this ) );

    stage.on( 'stagemouseup', ( function( event ) {
        
        if ( event.nativeEvent.button == 0 )
            this.mouse.lmb_state = 'up';
        else if ( event.nativeEvent.button == 2 )
            this.mouse.rmb_state = 'up';

    } ).bind( this ) );

    stage.addChild( this.health_text );

    if ( this.DEBUG ) {
    
        stage.addChild( new createjs.Shape() ).set({
            x: 10, y: 50,
        } ).graphics.f( 'red' ).dr( 0, 0, game.ppm, 5 );
    
    }

};

game_client.prototype.on_disconnect = function() {
    
    this.state = this.STATES.disconnected;
    
};

game_client.prototype.on_message = function( data ) {

    var commands = data.split('.');
    var command = commands[0];
    var subcommand = commands[1];
    var command_data = commands[2];

    switch( command ) {

        case 's': // Server message

            switch( subcommand ) {

                case 'e': // End game

                    this.on_disconnect( command_data );
                    break;

                case 'p': // Server ping

                    this.on_ping( command_data);
                    break;

                case 'o': // Other player info

                    this.on_other_player_info( command_data );
                    break;

            }
            break;

    }
};

game_client.prototype.on_ping = function( data ) {

};

game_client.prototype.on_player_info = function( data ) {

    for ( var i in data ) {

        var playerid = data[i];

        if ( !game.avatars[playerid] ) {
            
            var new_avatar = game.add_avatar( {
                id: playerid,
            } );
            
            this.add_sprite( playerid );
            
        }

    }

    for ( var playerid in game.avatars ) {
        
        if ( data.indexOf( playerid ) < 0 ) {
            
            this.remove_sprite( playerid );

            game.remove_avatar( {
                id: playerid,
            } );

        }

    }

};

game_client.prototype.on_server_update = function( data ) {
    
    // Cache the data from the server, then play the timeline back to
    // the player with a small delay (net_offset), allowing interpolation
    // between the points
    this.server_updates.push( data );

    // Limit the server updates in seconds worth of updates
    // 60fps * buffer.length = number of seconds of updates
    if ( this.server_updates.length >= ( 60 * this.max_update_buffer_size ) )
        this.server_updates.splice( 0, 1 );
        
    // We can see when the last tick we know of happened. if client_time
    // gets behind this due to latency, a snap occurs to the last tick.
    this.oldest_tick = this.server_updates[0].t;

    // TODO: interpolation
    for ( playerid in data.ps ) {
        
        if ( game.avatars[playerid] ) {
            
            game.avatars[playerid].set_position( data.ps[playerid].p.x, data.ps[playerid].p.y );
            game.avatars[playerid].orientation = data.ps[playerid].o;

            if ( game.avatars[playerid].health != data.ps[playerid].h )
                game.avatars[playerid].damage( game.avatars[playerid].health - data.ps[playerid].h );

        }

    }

};



game_client.prototype.add_sprite = function( player_id ) {

    if ( this.sprites[player_id] || !game.avatars[player_id] )
        return;

    this.sprites[player_id] = new game_sprite( game.avatars[player_id] );

    if ( this.DEBUG ) {

        stage.addChild( this.sprites[player_id].debug_position );

/**
            this.surface.beginPath();
            this.surface.arc( avatar.equipped_weapon.hitbox.x, avatar.equipped_weapon.hitbox.y, avatar.equipped_weapon.hitbox.radius, 0, 2 * Math.PI );
            this.surface.fillStyle = '#00FF00';
            this.surface.fill();
**/
        }

    stage.addChild( this.sprites[player_id].sprite );

}

game_client.prototype.remove_sprite = function( player_id ) {

    if ( !this.sprites[player_id] )
        return;

    delete this.sprites[player_id];
    stage.removeChild( this.sprites[player_id].sprite );

}
