
var game_menu = function( stage ) {

    this.stage = stage;

};

game_menu.prototype.show_loading_screen = function() {

    var loading_text = new createjs.Text( "Loading", "bold 30px Arial", "#ef5350" );
    loading_text.x = ( this.stage.canvas.width - loading_text.getBounds().width ) / 2;
    loading_text.y = ( this.stage.canvas.height - loading_text.getBounds().height ) / 2;

    this.stage.addChild( loading_text );
    this.stage.update();
};

game_menu.prototype.show_main_menu = function() {
    
    stage.removeAllChildren();
    stage.clear();

	var background = new createjs.Shape();
	background.name = "background";
	background.graphics.beginFill("red").drawRoundRect(0, 0, 150, 60, 10);
				
	var label = new createjs.Text("Start", "bold 24px Arial", "#FFFFFF");
	label.name = "label";
	label.textAlign = "center";
	label.textBaseline = "middle";
	label.x = 150/2;
	label.y = 60/2;

	var button = new createjs.Container();
	button.name = "button";
	button.x = 20;
	button.y = 20;
	button.addChild(background, label);
	// setting mouseChildren to false will cause events to be dispatched directly from the button instead of its children.
	// button.mouseChildren = false;
	
    button.addEventListener( "click", function() { console.log('click') } );

	stage.addChild( button );
	stage.update();

};
