// This is a manifest file that'll be compiled into including all the files listed below.
// Add new JavaScript/Coffee code in separate files in this directory and they'll automatically
// be included in the compiled file accessible from http://example.com/assets/application.js
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
//= require prefixfree.min
//= require preloadjs-0.2.0.min
//= require_self


(function(){
    console.log("About to start loading the files...");

    var manifest = [
        { src: '/assets/multiplayer.js', id: 'lib' },
        { src: '/assets/multiplayer-app.js', id: 'game' }
    ];

    var items = [];
    var progress = 10;


    var loader = new createjs.PreloadJS();
    loader.onComplete = handleComplete;
    loader.onFileLoad = handleFileLoad;
    loader.loadManifest(manifest);

    function isLoaded() {
        return (typeof kadi != 'undefined' && kadi.loaded && window.pl);
    }

    function handleComplete() {
        var timer = setInterval(function() {
            if (isLoaded()) {
                progress += 30;
                var player = window.pl;
                kadi.progressLoader('Hi ' + player.name + ". We won't be long...", 90);
                clearInterval(timer);

                _.delay(function() {
                    var me = new kadi.MultiPlayerUI(player, null, false);
                    var game = new kadi.MultiplayerGameUI(me);
                },0);
            }
        }, 500);
    }

    function updateProgress(val) {
        document.getElementById('progressAmountIndicator').style.width = val + "%";
    }

    function handleFileLoad(event) {
        switch (event.type){
            case createjs.PreloadJS.JAVASCRIPT:
//                console.log("loaded ", event.id, progress);
                document.body.appendChild(event.result);
                progress+= 10;
                updateProgress(progress);
                break;
        }
    }
})();
