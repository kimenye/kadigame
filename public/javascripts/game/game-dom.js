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

        node : function() {
            return $(this.div);
        },

        display: function() {
            this.parent.appendChild(this.div);
        },
        moveTo: function(x,y) {
            var options = {};
            if (kadi.isSomethingMeaningful(x)) {
                _.extend(options, {x: x + "px" });
            }
            if (kadi.isSomethingMeaningful(y)) {
                _.extend(options, {y: y + "px" });
            }
            this.node().transition(options, 500, 'snap');
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
            var left = this.left() + kadi.centerInFrame(this.width(),kadi.game.CardUI.WIDTH);
            var top = this.top();

            card.moveTo(left,top);
        },

        redrawCards: function() {
            var fan = kadi.flatChineseFan(this.width(),kadi.game.CardUI.WIDTH,kadi.game.CardUI.MARGIN,this.cards.length);
            var self = this;
            _.each(fan, function(blade, idx) {
                var card = self.cards[idx];
                card.moveTo(self.left() + blade.x,null,blade.rotate);
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
                card.display(me.GameUI.ID, pos.x, pos.y, pos.rotate);
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

    me.ActionButton = me.Box.extend({
        statics: {
            WIDTH: 200
        },
        construct : function(id, clickHandler) {
            this.parent.construct.apply(this, ['game','action_button_div', 'button action_button_cell'])
            var self = this;
            this.id = id;
            this.node().click(function() {
                clickHandler.callBack();
            });
            var x = me.PlayerDeck.X_A + kadi.centerInFrame(me.PlayerDeck.WIDTH_H, me.ActionButton.WIDTH);
            this.display(x,400);
        },

        buildButton: function() {
            var div = document.createElement("div");
            div.className = "share-wrapper below";

//            <div class="cell">
//                <div class="share-wrapper below">
//                    <div class="rc10 share-action icon-share"></div>
//                    <div class="share-container rc10 ">
//                        <a class="share-btn tl icon-google-plus" href='#'></a>
//                        <a class="share-btn tr icon-twitter" href='#'></a>
//                        <a class="share-btn br icon-facebook" href='#'></a>
//                        <a class="share-btn bl icon-pinterest" href='#'></a>
//                    </div>
//                </div>
//            </div>

            var shareAction = kadi.createDiv("rc10 share-action");
            div.appendChild(shareAction);

            var shareContainer = kadi.createDiv("share-container rc10");
            shareContainer.appendChild(kadi.createLink("share-btn tl"));
            shareContainer.appendChild(kadi.createLink("share-btn tr"));
//            shareContainer.appendChild(kadi.createLink("share-btn br icon-facebook"));
//            shareContainer.appendChild(kadi.createLink("share-btn bl icon-pinterest"));

            div.appendChild(shareContainer);

            return div;
        },

        display: function(x,y) {
            var elem = this.buildButton();
            this.div.appendChild(elem);
//            this.container().css('z-index','5000');
            this.node().css('z-index','600');
            this.parent.appendChild(this.div);
//            this.moveTo(x,y);
            this.moveTo(200,200);
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
//            this.actionButton = new me.ActionButton();
        },

        display : function() {
            kadi.ui.disableLoading('game');

            var self = this;

            this.playerDeck = new kadi.game.PlayerDeck(kadi.game.PlayerDeck.TYPE_A);
            this.playerDeckB = new kadi.game.PlayerDeck(kadi.game.PlayerDeck.TYPE_B);
            this.tableDeck = new kadi.game.TableDeck();
            _.delay(function() {
                self.startGame();
            },1000);
        },

        startGame : function() {
            _.each(_.range(4), function(idx) {
                var cardA = this.pickingDeck.deal();
                var cardB = this.pickingDeck.deal();

                cardA.active = true;
                cardA.flip();

                this.playerDeck.addCard(cardA);
                this.playerDeckB.addCard(cardB);
            },this);
            this.playerDeck.redrawCards();
            this.playerDeckB.redrawCards();
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
