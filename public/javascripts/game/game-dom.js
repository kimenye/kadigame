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

            cardElem.animate({
                left: kadi.game.PlayerDeck.X + kadi.centerInFrame(kadi.game.PlayerDeck.WIDTH,kadi.game.CardUI.WIDTH),
                top: kadi.game.PlayerDeck.Y,
                transform: "rotate(30deg);"
            },500);


            var x = kadi.game.PlayerDeck.X + kadi.centerInFrame(kadi.game.PlayerDeck.WIDTH,kadi.game.CardUI.WIDTH);
            _.delay(function() {
                self.redrawCards();
            }, 0);
        },

        redrawCards: function() {
            var fan = kadi.flatChineseFan(kadi.game.PlayerDeck.WIDTH,kadi.game.CardUI.WIDTH,kadi.game.CardUI.MARGIN,this.cards.length);
            var self = this;
            _.each(fan, function(blade, idx) {
                var card = self.cards[idx];
                card.disableClick = true;
                var cardElem = $(card.div);
                var options = {
                    left: kadi.game.PlayerDeck.X + blade.x,
                    rotate: blade.rotate + 'deg'
                }
                if (!card.revealed)
                {
                    _.extend(options, { rotateY: '180deg' });
                }
                cardElem.animate(options, 200,'linear');
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
        construct : function() {
            this.parent.construct.apply(this, ['game', 'picking_box_div', 'picking_box']);
            this.deck = kadi.game.Suite.getDeckOfCards();
            this.topLeft = function() { return new kadi.Pos(me.PickingDeck.X, me.PickingDeck.Y) }
            this.bBox = function() { return new kadi.BBox(this.topLeft(), me.PickingDeck.WIDTH, me.PickingDeck.HEIGHT) }
            this.display();
        },


        display: function() {
            var positions = kadi.randomizeCardLocations(this.deck.length, this.bBox());
            _.each(this.deck, function(card,idx) {
                var pos = positions[idx];
                card.display(me.GameUI.ID, pos.x, pos.y);
            });
        }
    });

    me.Button = me.Box.extend({
        construct : function(id, clickHandler) {
            var self = this;
            this.id = id;
            this.element = $('#' + id);
            this.element.click(function() {
                clickHandler.callBack();
            });
        },

        display: function() {

        }
    });

    me.GameUI = JS.Class({
        statics: {
            width: 800,
            height: 600,
            ID: 'game'
        },
        construct: function(player, opponents) {
            var self = this;
            this.player = player;
            this.id = me.GameUI.ID;
            this.opponents = [];
            this.opponents = _.collect(opponents, function(opponent) {
                return new me.GamePlayerUI(opponent.id, opponent.name);
            });
            this.pickingDeck = new me.PickingDeck();
        },

        display : function() {
            kadi.ui.disableLoading('game');

//            var self = this;
            this.startGameButton = new me.Button('start-game',new kadi.Handler(function() {
                $('#start-game').hide();
                this.startGame();
            }, this));

            this.playerDeck = new kadi.game.PlayerDeck();
//
//            var card;
//            card = new kadi.game.CardUI(kadi.game.Card.KING,kadi.game.Suite.HEARTS,true);
//            card.display(this.id,350,5);
//
//            player_deck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.QUEEN,kadi.game.Suite.DIAMONDS,true);
//            card.display(this.id,110,5);
//
//            player_deck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.JACK,kadi.game.Suite.HEARTS,true);
//            card.display(this.id,215,5);
//
//            player_deck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.ACE,kadi.game.Suite.SPADES,true);
//            card.display(this.id,320,5);
//
//            player_deck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.TEN,kadi.game.Suite.SPADES,true);
//            card.display(this.id,425,5);
//
//            player_deck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.NINE,kadi.game.Suite.CLUBS,true);
//            card.display(this.id,530,5);
//
//            player_deck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.EIGHT,kadi.game.Suite.DIAMONDS,true);
//            card.display(this.id,635,5);
//
//            player_deck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.SEVEN,kadi.game.Suite.HEARTS,true);
//            card.display(this.id,5,145);
//
//            player_deck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.SIX,kadi.game.Suite.SPADES,true);
//            card.display(this.id,110,145);
//
//            player_deck.addCard(card);
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
        },

        startGame : function() {
            console.log("Starting game");
//            var card;
//            card = new kadi.game.CardUI(kadi.game.Card.KING,kadi.game.Suite.HEARTS,true);
//            card.display(this.id,350,5);
//
//            this.playerDeck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.QUEEN,kadi.game.Suite.DIAMONDS,true);
//            card.display(this.id,110,5);
//
//            this.playerDeck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.JACK,kadi.game.Suite.HEARTS,true);
//            card.display(this.id,215,5);
//
//            this.playerDeck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.ACE,kadi.game.Suite.SPADES,true);
//            card.display(this.id,320,5);
//
//            this.playerDeck.addCard(card);
//
//            card = new kadi.game.CardUI(kadi.game.Card.TEN,kadi.game.Suite.SPADES,true);
//            card.display(this.id,425,5);
//
//            this.playerDeck.addCard(card);
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
