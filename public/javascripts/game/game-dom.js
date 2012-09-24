window.kadi.game = (function(me, $, undefined){

    me.GamePlayerUI = JS.Class({
        construct : function(id, name) {
            this.id = id;
            this.name = name;
        },
        display: function() {

        }
    });


    me.GameUI = JS.Class({
        statics: {
            width: 800,
            height: 600
        },
        construct: function(me, opponents) {
            var self = this;
            this.me = me;
            this.opponents = [];
            this.opponents = _.collect(opponents, function(opponent) {
                return new me.GamePlayerUI(opponent.id, opponent.name);
            });
        }
    });

    /**
     * Initialize the game environment
     *
     * @param player
     * @param opponents
     */
    me.initGameUI = function(player, opponents) {

        kadi.ui.updateLoadingText('Preparing the board...');

        me.gameObject = new me.GameUI(player, opponents);
    }

    return me;
})(window.kadi.game || {}, jQuery);
