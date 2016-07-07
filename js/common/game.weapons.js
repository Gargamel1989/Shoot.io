
var weapon_knife = function( avatar ) {
    
    this.avatar = avatar;

    // The hitbox is relative to the position of the avatar when it is not rotated
    this.hitbox = new game_collider_circle( 1.2 * avatar.collider.radius, 0, avatar.collider.radius );
    this.anchor_distance = Math.sqrt( this.hitbox.x * this.hitbox.x + this.hitbox.y * this.hitbox.y );

    this.attack_duration = 1; // Seconds

    this.damage = function() {
        return 25;
    };



    this.last_usage = null;

};

if( 'undefined' != typeof global )
    module.exports = global.weapon_knife = weapon_knife;

weapon_knife.prototype.update = function( dt ) {

};

weapon_knife.prototype.use_start = function() {

    var now = new Date();

    // Check if we are still processing the last attack
    if ( this.last_usage && ( now.getTime() - this.last_usage.getTime() ) / 1000.0 <= this.attack_duration )
        return false;

    var hitbox_global_position = new game_collider_circle(
            this.avatar.position.x + this.anchor_distance * Math.cos( this.avatar.orientation ),
            this.avatar.position.y + this.anchor_distance * Math.sin( this.avatar.orientation ),
            this.hitbox.radius
    );

    for ( var playerid in this.avatar.game.avatars ) {
        
        var avatar = this.avatar.game.avatars[playerid];

        if ( avatar == this.avatar )
            continue;

        if ( hitbox_global_position.has_intersection_circle( this.avatar.game.avatars[playerid].collider ) )
            avatar.damage( this.damage() );

    }

    this.last_usage = now;

};



var weapon_handgun = function( avatar ) {
    
    this.avatar = avatar;

    this.attack_duration = 1; // Seconds

    this.damage = function() {
        return 25;
    };



    this.last_usage = null;

};

if( 'undefined' != typeof global )
    module.exports = global.weapon_handgun = weapon_handgun;

weapon_handgun.prototype.update = function( dt ) {

};

weapon_handgun.prototype.use_start = function() {

    var now = new Date();

    // Check if we are still processing the last attack
    if ( this.last_usage && ( now.getTime() - this.last_usage.getTime() ) / 1000.0 <= this.attack_duration )
        return false;

    var hitbox_global_position = new game_collider_circle(
            this.avatar.position.x + this.anchor_distance * Math.cos( this.avatar.orientation ),
            this.avatar.position.y + this.anchor_distance * Math.sin( this.avatar.orientation ),
            this.hitbox.radius
    );

    for ( var playerid in this.avatar.game.avatars ) {
        
        var avatar = this.avatar.game.avatars[playerid];

        if ( avatar == this.avatar )
            continue;

        if ( hitbox_global_position.has_intersection_circle( this.avatar.game.avatars[playerid].collider ) )
            avatar.damage( this.damage() );

    }

    this.last_usage = now;

};
