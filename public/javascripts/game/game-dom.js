var GameUI = JS.Class({
    statics: {
        width: 800,
        height: 600
    },
    construct: function(me, opponents) {
        var self = this;
        this.me = me;
        this.opponents = [];
        this.opponents = _.collect(opponents, function(opponent) {
            return new GamePlayerUI(opponent.id, opponent.name);
        });
    }
});