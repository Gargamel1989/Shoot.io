/*
 * The avatar class
 *
 * A simple class to maintain state of a players avatar in the game
 *
 */
var game_avatar = function( game_instance, player_instance ) {

    this.STATES = {
        not_connected: 'not-connected',
    }
    
    this.game = game_instance;
    this.player = player_instance;

    this.sprite_height = 60;

    // Current position of the player
    this.position = { x: 0, y: 0 };
    // Degrees in radians between the line ((0, 0), (1, 0)) and the looking direction
    // of this avatar
    this.orientation = 0;

    // Movement speed of the player until the next input cycle
    // X is the forward axes of the player
    // Y is the right axes of the player
    this.movement_speed = { x: 0, y: 0 };
    // The absolute point in the canvas where the pointer is located and thus to where the avatar should be looking
    this.looking_at = { x: 0, y: 0 };
    
    // Rectangle for collision detection
    this.collider = new game_collider_circle(0, 0, this.sprite_height / 2.5 );

    this.base_speed = 2.8; // m / s

    this.max_health = 100;
    this.health = this.max_health;

    this.inventory = [ new weapon_knife( this ), ];
    this.equipped_weapon = this.inventory[0];
    
    // Input list received by the client
    this.inputs = [];
    this.last_input_seq = 0;
    this.last_input_time = null;

    this.state = this.STATES.not_connected;

}; //game_avater.constructor

// Server side we set the 'game_avatar' class to a global type, so that it can use it anywhere.
if( 'undefined' != typeof global )
    module.exports = global.game_avatar = game_avatar;



game_avatar.prototype.update = function( dt ) {

    if ( this.looking_at.x !== null && this.looking_at.y !== null ) {

        // Calculate the new orientation of the player
        var mag = this.game.v_mag( this.game.v_sub( this.position, this.looking_at ) );
        var x_diff = this.looking_at.x - this.position.x;

        this.orientation = Math.acos( x_diff / mag );

        if ( this.looking_at.y < this.position.y )
            this.orientation = 2 * Math.PI - this.orientation;

    }

    this.equipped_weapon.update( dt );

    if ( this.position.x == null || this.position.y == null )
        return;
    
    if ( this.movement_speed.x == 0 && this.movement_speed.y == 0 )
        return;
    
    var old_x = this.position.x;
    var old_y = this.position.y;

    var movement_vector = this.game.v_mul_scalar( this.movement_speed, dt / 1000 );
    var movement_mag = this.game.v_mag( movement_vector );
    var movement_angle = this.game.v_angle( movement_vector );

    var absolute_movement = {
        x: this.game.ppm * movement_mag * Math.cos( this.orientation + movement_angle ),
        y: this.game.ppm * movement_mag * Math.sin( this.orientation + movement_angle ),
    }
    
    var new_position = this.game.v_add( this.position, absolute_movement );
    this.set_position( new_position.x, new_position.y );

    for ( playerid in this.game.avatars ) {
        var other_avatar = this.game.avatars[playerid];

        if ( other_avatar == this )
            continue;

        if ( this.collider.has_intersection_circle( other_avatar.collider ) ) {

            // If the new position makes us collide with something, we have to stay
            // at the old position
            this.set_position( old_x, old_y );
            
            // If we stay at the old position, we can stop checking for collisions
            break;

        }

    }
    
};



game_avatar.prototype.damage = function( amount ) {

    this.health -= amount;

};

game_avatar.prototype.look_at = function( global_point ) {

    this.looking_at = global_point;

};

game_avatar.prototype.move_along = function( forward, right ) {

    this.movement_speed = {
        x: forward,
        y: right
    };
    
    // If both are zero we are done here
    if ( forward == 0 && right == 0 )
        return;
    
    // Normalize input vector
    var norm_factor = ( 1 / this.game.v_mag( this.movement_speed ) );

    // Find the speed at which we can move
    var speed = this.base_speed;

    if ( forward < 0 )
        this.base_speed *= 0.5;

    this.movement_speed = this.game.v_mul_scalar( this.movement_speed, norm_factor * speed );
    
};

game_avatar.prototype.primary_action_start = function() {

    if ( this.equipped_weapon.use_start )
        this.equipped_weapon.use_start();

};

game_avatar.prototype.primary_action_end = function() {

    if ( this.equipped_weapon.use_end )
        this.equipped_weapon.use_end();

};

game_avatar.prototype.secondary_action_start = function() {

};

game_avatar.prototype.secondary_action_end = function() {

};



game_avatar.prototype.set_position = function ( x, y, z ) {

    this.position = {
        x: x,
        y: y,
        z: z || 0
    };

    this.collider.x = x;
    this.collider.y = y;

};



var game_collider_circle = function( x, y, radius ) {

    this.x = x;
    this.y = y;
    this.radius = radius;

};

// Server side we set the 'game_avatar' class to a global type, so that it can use it anywhere.
if( 'undefined' != typeof global )
    module.exports = global.game_collider_circle = game_collider_circle;

game_collider_circle.prototype.has_intersection_circle = function( other_collider_circle ) {
    
    var d_x = this.x - other_collider_circle.x;
    var d_y = this.y - other_collider_circle.y;
    var distance = Math.sqrt( d_x * d_x + d_y * d_y );

    if ( distance < this.radius + other_collider_circle.radius )
        return true;

    return false;

};

game_collider_circle.prototype.has_intersection_rect = function( other_collider_rect ) {

};

var game_collider_rect = function( x0, y0, x1, y2, x3, y3, x4, y4 ) {

};

// Server side we set the 'game_avatar' class to a global type, so that it can use it anywhere.
if( 'undefined' != typeof global )
    module.exports = global.game_collider_rect = game_collider_rect;

game_collider_rect.prototype.has_intersection_circle = function( other_collider_circle ) {

    return other_collider_circle.has_intersection_rect( this );

};

game_collider_rect.prototype.has_intersection_rect = function( other_collider_rect ) {



};
