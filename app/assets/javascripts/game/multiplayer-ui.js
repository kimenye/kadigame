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
        { src: '/assets/multiplayer.js', id: 'multiplayer_javascript' }
    ];

    var items = [];
    var progress = 5;


    var loader = new createjs.PreloadJS();
    loader.onComplete = handleComplete;
    loader.onFileLoad = handleFileLoad;
    loader.loadManifest(manifest);

    function isLoaded() {
        return (typeof kadi != 'undefined' && kadi.loaded);
    }

    function handleComplete() {
        var timer = setInterval(function() {
            if (isLoaded()) {
                progress += 30;
                kadi.progressLoader('Finished loading assets...', progress);
                clearInterval(timer);
            }
        }, 1000);
    }

    function updateProgress(val) {
        var loadedSpan = document.getElementById('splashAmountLoaded');
        if (loadedSpan) {
            loadedSpan.style.width = val + "%";
        }
    }

    function handleFileLoad(event) {
        switch (event.type){
            case createjs.PreloadJS.JAVASCRIPT:
                document.body.appendChild(event.result);
                progress+= 5;
                updateProgress(progress);
                break;
        }
    }
})();
