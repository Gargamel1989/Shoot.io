// FSM Animation States
var F_IDLE = 100,
    F_RUN = 101,
    F_RSTRAFE = 102,
    F_LSTRAFE = 103,
    F_BACKSTEP = 104;

var game_sprite = function( avatar ) {

    this.avatar = avatar;

    this.sprite_scale = 0.5;


    this.sprite = new createjs.Sprite( assets.getResult( 'feet' ), 'run' );
    
    this.sprite.scaleX = this.sprite_scale;
    this.sprite.scaleY = this.sprite_scale;

    this.debug_position = new createjs.Shape();
    this.debug_position.graphics.f( 'red' ).dc( 0, 0, this.avatar.collider.radius );

    this.feet_state = F_IDLE; 
   
};

game_sprite.prototype.update = function( dt ) {
    
    
};

game_sprite.prototype.late_update = function( ) {
    
    if ( !this.avatar.position )
        return;

    this.sprite.x = this.avatar.position.x;
    this.sprite.y = this.avatar.position.y;

    this.sprite.rotation = 360 * this.avatar.orientation / ( 2 * Math.PI );

    this.debug_position.x = this.avatar.position.x;
    this.debug_position.y = this.avatar.position.y;

    var last_feet_state = this.feet_state;
    
    if ( this.avatar.movement_speed.x < 0 )
        this.feet_state = F_BACKSTEP;

    else if ( this.avatar.movement_speed.y > 0 && this.avatar.movement_speed.y > this.avatar.movement_speed.x )
        this.feet_state = F_RSTRAFE;

    else if ( this.avatar.movement_speed.y < 0 && ( -1 * this.avatar.movement_speed.y ) > this.avatar.movement_speed.x )
        this.feet_state = F_LSTRAFE;

    else if ( game.v_mag( this.avatar.movement_speed ) > 0.01 )
        this.feet_state = F_RUN;

    else
        this.feet_state = F_IDLE;
   
    if ( last_feet_state != this.feet_state ) {

        if ( this.feet_state == F_IDLE )
            this.sprite.gotoAndPlay( 'idle' );

        else if ( this.feet_state == F_RUN )
            this.sprite.gotoAndPlay( 'run' );

        else if ( this.feet_state == F_RSTRAFE )
            this.sprite.gotoAndPlay( 'run' );

        else if ( this.feet_state == F_LSTRAFE )
            this.sprite.gotoAndPlay( 'run' );

        else if ( this.feet_state == F_BACKSTEP )
            this.sprite.gotoAndPlay( 'backstep' );

    }
    
};
