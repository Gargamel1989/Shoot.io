/**
 * The main game class. This gets create on both server
 * and client. The server creates one for each game that
 * is hosted. The client creates one for itself to play
 * the game.
 **/

var game_core = function(game_instance) {
    
    this.instance = game_instance;
    this.server = this.instance !== undefined;

    this.world = {
        width: 720,
        height: 480,
    };

    // Pixels per meter in the game world
    this.ppm = 100;

    this.avatars = {};

    this.prev_mouse_x = null;
    this.prev_mouse_y = null;

}

// Server side we set the 'game_core' class to a global type, so that it can use it anywhere.
if( 'undefined' != typeof global )
    module.exports = global.game_core = game_core;

// Helper functions
// (4.22208334636).fixed(n) will return fixed point value to n places, default n = 3
Number.prototype.fixed = function(n) { n = n || 3; return parseFloat(this.toFixed(n)); };
// Copies a 2d vector like object from one to another
game_core.prototype.pos = function(a) { return {x:a.x,y:a.y}; };
// Add a 2d vector with another one and return the resulting vector
game_core.prototype.v_add = function(a,b) { return { x:(a.x+b.x).fixed(), y:(a.y+b.y).fixed() }; };
// Subtract a 2d vector with another one and return the resulting vector
game_core.prototype.v_sub = function(a,b) { return { x:(a.x-b.x).fixed(),y:(a.y-b.y).fixed() }; };
// Multiply a 2d vector with a scalar value and return the resulting vector
game_core.prototype.v_mul_scalar = function(a,b) { return {x: (a.x*b).fixed() , y:(a.y*b).fixed() }; };
// Magnitude of a vector
game_core.prototype.v_mag = function( v ) { return Math.sqrt( v.x * v.x + v.y * v.y ); };
// Angle of a vector
game_core.prototype.v_angle = function( v ) { return Math.atan2( v.y, v.x ); }
// For the server, we need to cancel the setTimeout that the polyfill creates
game_core.prototype.stop_update = function() {  window.cancelAnimationFrame( this.updateid );  };
// Simple linear interpolation
game_core.prototype.lerp = function(p, n, t) { var _t = Number(t); _t = (Math.max(0, Math.min(1, _t))).fixed(); return (p + _t * (n - p)).fixed(); };
// Simple linear interpolation between 2 vectors
game_core.prototype.v_lerp = function(v,tv,t) { return { x: this.lerp(v.x, tv.x, t), y:this.lerp(v.y, tv.y, t) }; };


game_core.prototype.add_avatar = function( player ) {
    
    if (this.server)
        this.avatars[player.id] = new game_avatar(this, player);
    else
        this.avatars[player.id] = new game_avatar(this);

    return this.avatars[player.id];

}

game_core.prototype.remove_avatar = function( player ) {
    
    if ( this.avatars[player.id] )
        delete this.avatars[player.id];

};



game_core.prototype.process_input = function( avatar ) {

    // It's possible to have received multiple inputs by now, so
    // we process each one
    var forward = 0,
        right = 0,
        m_x = this.prev_mouse_x,
        m_y = this.prev_mouse_y;

    var ic = avatar.inputs.length;

    if ( ic ) {

        for ( var j = 0; j < ic; ++j ) {

            // Don't process ones we already have simulated locally
            if ( avatar.inputs[j].seq <= avatar.last_input_seq )
                continue;

            var input = avatar.inputs[j].inputs;
            var c = input.length;
            for ( var i = 0; i < c; ++i ) {

                var parts = input[i].split( '|' );
                var key = parts[0];

                if ( key == 'l' )
                    right -= 1;

                if ( key == 'r' )
                    right += 1;

                if ( key == 'u' )
                    forward += 1;

                if ( key == 'd' )
                    forward -= 1;
                
                if ( key == 'm' ) {

                    if ( parts[1] == 'l' ) {

                        // Left mouse button event
                        if ( parts[2] == 'down' )
                            avatar.primary_action_start();
                        else if ( parts[2] == 'up' )
                            avatar.primary_action_end();

                    } else if ( parts[1] == 'r' ) {
                     
                        /// Right mouse button event
                        if ( parts[2] == 'down' )
                            avatar.secondary_action_start();
                        else if ( parts[2] == 'up' )
                            avatar.secondary_action_end();

                    } else {

                        // Mouse movement
                        m_x = parts[1].replace( ',', '.' );
                        m_y = parts[2].replace( ',', '.' );
                    
                    }

                }
            }
        
        }

    }
    
    var input_vector = {
        movement: {
            forward: forward,
            right: right,
        },
        mouse: {
            x: m_x,
            y: m_y,
        }
    };
    
    if ( avatar.inputs.length ) {

        // We van now clear the array since these have been processed
        avatar.last_input_time = avatar.inputs[ic - 1].time;
        avatar.last_input_seq = avatar.inputs[ic-1].seq;

        avatar.inputs = [];

    }

    return input_vector;

};
