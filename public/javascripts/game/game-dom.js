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
            $(this.div).css('z-index','0');
        },

        display: function() {
            this.parent.appendChild(this.div);
        }
    });

    me.PlayerDeck = me.Box.extend({
        statics: {
            WIDTH_H: 400,
            Y_A: 500,
            X_A: 200,
            X_B: 200,
            Y_B: -20,
            TYPE_A: 'A',
            TYPE_B: 'B',
            TYPE_C: 'C',
            TYPE_D: 'D'
        },
        construct: function(type) {
            this.type = type;
            this.parent.construct.apply(this, ['game', 'player_deck_div' + type, 'player_deck ' + type]);
            this.display();
            this.cards = [];
        },

        left: function() {
            if (this.type == kadi.game.PlayerDeck.TYPE_A || this.type == kadi.game.PlayerDeck.TYPE_B) {
                return kadi.game.PlayerDeck.X_A;
            }
        },

        top : function() {
            if (this.type == kadi.game.PlayerDeck.TYPE_A) {
                return kadi.game.PlayerDeck.Y_A;
            }
            else if (this.type == kadi.game.PlayerDeck.TYPE_B) {
                return kadi.game.PlayerDeck.Y_B;
            }
        },

        width: function() {
            return kadi.game.PlayerDeck.WIDTH_H;
        },

        addCard: function(card) {
            this.cards.push(card);
            var self = this;
            var cardElem = $(card.div);

            cardElem.animate({
                left: this.left() + kadi.centerInFrame(this.width(),kadi.game.CardUI.WIDTH),
                top: this.top()
//                transform: "rotate(30deg);"
            },500);

            _.delay(function() {
                self.redrawCards();
            }, 0);
        },

        redrawCards: function() {
            var fan = kadi.flatChineseFan(this.width(),kadi.game.CardUI.WIDTH,kadi.game.CardUI.MARGIN,this.cards.length);
            var self = this;
            _.each(fan, function(blade, idx) {
                var card = self.cards[idx];
                var cardElem = card.elem();
                var options = {
                    left: self.left() + blade.x,
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
            Y: 200
        },
        construct : function() {
            this.parent.construct.apply(this, ['game', 'picking_box_div', 'picking_box']);
            this.deck = kadi.game.Suite.getDeckOfCards();
            this.topLeft = function() { return new kadi.Pos(me.PickingDeck.X, me.PickingDeck.Y) };
            this.bBox = function() { return new kadi.BBox(this.topLeft(), me.PickingDeck.WIDTH, me.PickingDeck.HEIGHT) };
            this.display();
        },


        display: function() {
            var positions = kadi.randomizeCardLocations(this.deck.length, this.bBox());
            _.each(this.deck, function(card,idx) {
                var pos = positions[idx];
                card.display(me.GameUI.ID, pos.x, pos.y);
            });
        },

        deal: function() {
            return this.deck.shift();
        }
    });

    me.TableDeck = me.Box.extend({
        statics: {
            WIDTH: 150,
            HEIGHT: 200,
            X: 250,
            Y: 200
        },
        construct : function() {
            this.parent.construct.apply(this, ['game', 'table_deck_div', 'table_deck']);
            this.cards = [];
            this.display();
        },
        addCard: function(card) {

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

            var self = this;
//            this.startGameButton = new me.Button('start-game',new kadi.Handler(function() {
//                $('#start-game').hide();
//                this.startGame();
//            }, this));

            this.playerDeck = new kadi.game.PlayerDeck(kadi.game.PlayerDeck.TYPE_A);
            this.playerDeckB = new kadi.game.PlayerDeck(kadi.game.PlayerDeck.TYPE_B);
            this.tableDeck = new kadi.game.TableDeck();
            _.delay(function() {
                self.startGame();
            },1000);
        },

        startGame : function() {
//            console.log("Starting game");
            _.each(_.range(4), function(idx) {
                var cardA = this.pickingDeck.deal();
                var cardB = this.pickingDeck.deal();

                cardA.flip();
                cardA.playable = true;

                this.playerDeck.addCard(cardA);
                this.playerDeckB.addCard(cardB);
            },this);
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
    };

    return me;
})(window.kadi.game || {}, jQuery);
