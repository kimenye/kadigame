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

    me.PlayerDeck = me.Box.extend({
        statics: {
            WIDTH: 400,
            Y: 500,
            X: 200
        },
        construct: function() {
            this.parent.construct.apply(this, ['game', 'player_deck_div', 'player_deck']);
            this.display();
            this.cards = [];
        },

        addCard: function(card) {
            this.cards.push(card);
            var self = this;
            var cardElem = $(card.div);

//            $(card.div).appendTo($(this.div));
            cardElem.animate({
                left: kadi.game.PlayerDeck.X + kadi.centerInFrame(kadi.game.PlayerDeck.WIDTH,kadi.game.CardUI.WIDTH),
                top: kadi.game.PlayerDeck.Y
            },1000);

            _.delay(function() {
                self.redrawCards();
            }, 1000);
        },

        redrawCards: function() {
            var fan = kadi.flatChineseFan(kadi.game.PlayerDeck.WIDTH,kadi.game.CardUI.WIDTH,kadi.game.CardUI.MARGIN,this.cards.length);
            var self = this;
            _.each(fan, function(blade, idx) {
                var card = self.cards[idx];
                var cardElem = $(card.div);
                var elem = $(self.div);
                console.log("Card: %s, Idx: %d x: %d", card.translate(), idx, blade.x);
                cardElem.animate({
                    left: kadi.game.PlayerDeck.X + blade.x
                }, 200);
            });
        }
    })

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

            var player_deck = new kadi.game.PlayerDeck();

            var card;
            card = new kadi.game.CardUI(kadi.game.Card.KING,kadi.game.Suite.HEARTS,true);
            card.display(this.id,5,5);

            player_deck.addCard(card);

            card = new kadi.game.CardUI(kadi.game.Card.QUEEN,kadi.game.Suite.DIAMONDS,true);
            card.display(this.id,110,5);

            player_deck.addCard(card);

            card = new kadi.game.CardUI(kadi.game.Card.JACK,kadi.game.Suite.HEARTS,true);
            card.display(this.id,215,5);

            player_deck.addCard(card);

            card = new kadi.game.CardUI(kadi.game.Card.ACE,kadi.game.Suite.SPADES,true);
            card.display(this.id,320,5);

//            player_deck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.TEN,kadi.game.Suite.SPADES,false);
//            card.display(this.id,425,5);
//
//            card = new kadi.game.CardUI(kadi.game.Card.NINE,kadi.game.Suite.CLUBS,false);
//            card.display(this.id,530,5);
//
//            card = new kadi.game.CardUI(kadi.game.Card.EIGHT,kadi.game.Suite.DIAMONDS,false);
//            card.display(this.id,635,5);
//
//            card = new kadi.game.CardUI(kadi.game.Card.SEVEN,kadi.game.Suite.HEARTS,false);
//            card.display(this.id,5,145);
//
//            card = new kadi.game.CardUI(kadi.game.Card.SIX,kadi.game.Suite.SPADES,false);
//            card.display(this.id,110,145);
//
//            card = new kadi.game.CardUI(kadi.game.Card.FIVE,kadi.game.Suite.CLUBS,false);
//            card.display(this.id,215,145);
//
//            card = new kadi.game.CardUI(kadi.game.Card.FOUR,kadi.game.Suite.HEARTS,false);
//            card.display(this.id,320,145);
//
//            card = new kadi.game.CardUI(kadi.game.Card.THREE,kadi.game.Suite.SPADES,false);
//            card.display(this.id,425,145);
//
//            card = new kadi.game.CardUI(kadi.game.Card.TWO,kadi.game.Suite.DIAMONDS,false);
//            card.display(this.id,530,145);
//
//            card = new kadi.game.CardUI(kadi.game.Card.JOKER_B,kadi.game.Suite.JOKERS,false);
//            card.display(this.id,635,145);
//
//            card = new kadi.game.CardUI(kadi.game.Card.JOKER_A,kadi.game.Suite.JOKERS,true);
//            card.display(this.id,5,285);
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
