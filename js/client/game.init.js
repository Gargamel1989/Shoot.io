// A window global for our game root variable
var game = {},
    assets,
    stage;

var assets_manifest = [
    { id: 'feet', src: 'img/sprites/test', type: 'spritesheet' },
];

window.onload = function() {

    // Create our game client instance
    game = new game_core();

    // Fetch the viewport
    game.viewport = document.getElementById('viewport');

    var client = new game_client(game.viewport);

    var body = document.getElementById('body');
    var scale = Math.min( body.clientWidth / client.viewport_size.width, body.clientHeight / client.viewport_size.height );

    game.viewport.style.width = ( client.viewport_size.width * scale ).toFixed(0) + "px";
    game.viewport.style.height = ( client.viewport_size.height * scale ).toFixed(0) + "px";

    // Adjust their size
    game.viewport.width = client.viewport_size.width;
    game.viewport.height = client.viewport_size.height;

    stage = new createjs.Stage( 'viewport' );
    stage.mouseMoveOutside = true;

    // Create game menu screen
    var menu = new game_menu( stage );
    // Show the loading screen
//    menu.show_loading_screen();

    // Start Asset Loading
    assets = new createjs.LoadQueue( true, '/' );
    
    assets.addEventListener( 'complete', function() {
       // console.log(assets.getLoadedItems());
       // menu.show_main_menu();

        // Connect the client to the socket.io server
        client.connect_to_server();
       
        // Start the update loop when all assets have been loaded
        MainLoop.setBegin(client.handle_input.bind(client))
                .setUpdate(client.update.bind(client))
                .setDraw(client.draw.bind(client)).start();

    } );

    assets.loadManifest( assets_manifest );


}; //window.onload
