var GamePlayerUI = JS.Class({
    construct : function(id, name) {
        this.id = id;
        this.name = name;
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
    }
});
