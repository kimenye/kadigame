window.kadi.game = (function(me, $, undefined){

    me.GamePlayerUI = JS.Class({
        construct : function(id, name) {
            this.id = id;
            this.name = name;
        },
        display: function() {

        }
    });

    me.Box = JS.Class({
        construct: function(parent,id,className,x,y,width,height) {
            this.id = id;
            this.div = document.createElement("DIV");
            this.div.id = id;
            this.div.className = className;
            this.parent = document.getElementById(parent);
        },

        display: function() {
            this.parent.appendChild(this.div);
        }
    });

    me.PickingDeck = me.Box.extend({
        statics : {
            WIDTH:  150,
            HEIGHT: 200,
            X: 500,
            Y: 150
        },
        construct : function(numCards) {
            this.parent.construct.apply(this, ['game', 'picking_box_div', 'picking_box']);
            this.display();
            this.numCards = numCards;
        },

        init: function() {

        }
    });

    me.GameUI = JS.Class({
        statics: {
            width: 800,
            height: 600
        },
        construct: function(player, opponents) {
            var self = this;
            this.player = player;
            this.id = 'game';
            this.opponents = [];
            this.opponents = _.collect(opponents, function(opponent) {
                return new me.GamePlayerUI(opponent.id, opponent.name);
            });
            this.pickingDeck = new me.PickingDeck(52);
        },

        display : function() {
            kadi.ui.disableLoading('game');

            var card = new kadi.game.CardUI(kadi.game.Card.JACK,kadi.game.Suite.HEARTS,false);
            console.log("Picking deck id ", this.pickingDeck.id);
            card.display(this.id);
        }
    });

    /**
     * Initialize the game environment
     *
     * @param player
     * @param opponents
     */
    me.initGameUI = function(player, opponents) {
        kadi.ui.updateLoadingText('Welcome ' + player.name + '. Preparing the game...');
        me.gameObject = new me.GameUI(player, opponents);
        me.gameObject.display();


    }

    return me;
})(window.kadi.game || {}, jQuery);
