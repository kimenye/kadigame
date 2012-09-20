var BackgroundUI = JS.Class({
    construct : function(imagePath,targetLayer,x,y) {
        var _self = this;

        var _bgImageObj = new Image();
        _bgImageObj.onload = function() {
            var _img = new Kinetic.Image({
                x: isSomethingMeaningful(x) ? x : 0,
                y: isSomethingMeaningful(y) ? y : 0,
                image: _bgImageObj
            });

            targetLayer.add(_img);
            _img.moveToBottom();
            targetLayer.draw();

            console.log("Loaded splash screen. Z-index ", _img.getZIndex());
//            SHOTGUN.fire(Constants.EVENT_READY, ["splash","Splash screen loaded"],'splash');
        };
        _bgImageObj.src = imagePath;
    }
});

var GamePlayerUI = JS.Class({
    construct : function(id, name) {
        this.id = id;
        this.name = name;
    },
    display: function() {

    }
});

var GameUI = JS.Class({
    statics: {
        width: 800,
        height: 600
    },
    construct: function(me, opponents) {
        this.me = me;
        this.opponents = [];
        this.opponents = _.collect(opponents, function(opponent) {
            return new GamePlayerUI(opponent.id, opponent.name);
        });

        console.log("Preparing stage");

        this.stage = new Kinetic.Stage({
            container: "game",
            width: GameUI.width,
            height: GameUI.height
        });

        this.backgroundLayer = new Kinetic.Layer();

        this.bg = new BackgroundUI("images/woodback.jpg", this.backgroundLayer, 0, 0);
        this.stage.add(this.backgroundLayer);
    }
});
