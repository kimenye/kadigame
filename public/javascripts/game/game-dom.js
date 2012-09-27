window.kadi.game = (function(me, $, undefined){

    me.Events = JS.Class({
        statics : {
            CARD_SELECTED : "card-selected",
            CARD_DESELECTED: "card-deselected",
            PICK_CARD: "pick-card",
            CARDS_DEALT: "cards-dealt",
            END_TURN: "end-turn",
            RECEIVE_TURN: "receive-turn"
        }
    });

    me.Game = JS.Class({
        construct: function(player, opponents) {
            this.me = player;
            this.opponents = opponents;
            this.players = this.opponents;
            this.players.push(this.me);
            console.log("The players are : ", this.players);
            this.pickingDeck = new kadi.game.PickingDeck();
            this.tableDeck = new kadi.game.TableDeck();
        },

        startGame: function() {
            console.log("Players in game", this.players.length, this.players);
            var starter = kadi.coinToss(this.players);

            _.each(this.players, function(p) {
                p.initHandlers();
            });
//            this.order = new me.Order(this.players,starter);
            this.dealCards();
        },

        dealCards: function() {
            _.each(_.range(3), function(idx) {
                _.each(this.players, function(p) {
                    var card = this.pickingDeck.deal();
                    console.log("To deal card %s to %s", card.toS(), p.name);
                    p.addCard(card);
                },this);
            },this);

            SHOTGUN.fire(kadi.game.Events.CARDS_DEALT,[]);

//            this.tableDeck.addCard(startingCard, true);
        }
    });

    me.Player = JS.Class({
        construct : function(id, name,live) {
            this.id = id;
            this.name = name;
            this.live = live;
        }
    });

    me.GamePlayerUI = me.Player.extend({
        construct : function(player, deck) {
            this.parent.construct.apply(this, [player.id,player.name,player.live]);
            this.deck = deck;
            this.turnToPlay = false;
            this.selections = [];
        },
        addCard: function(card,redraw) {
            if (this.live)
                card.flip();
            this.deck.addCard(card);
            if (redraw)
                this.deck.redrawCards();
        },
        initHandlers: function() {
            var self = this;
            if (this.live) {
                console.log("Setting up ", this.name);
                SHOTGUN.listen(kadi.game.Events.CARD_SELECTED, function(card) {
                    self.handleCardSelected(card);
                    self.selections.push(card);
                });

                SHOTGUN.listen(kadi.game.Events.CARD_DESELECTED, function(card) {
                    self.handleCardDeselected(card);
                });

                this.btnMove = $('.btn-move').click(function(btn) {
                    if (kadi.isEnabled(this))
                        self.move();
                });
                this.btnPick = $('.btn-pick').click(function() {
                    if (kadi.isEnabled(this))
                        self.pick();
                });
                this.btnKadi = $('.btn-kadi').click(function() {
                    if (kadi.isEnabled(this))
                        self.kadi();
                });
            }

            SHOTGUN.listen(kadi.game.Events.CARDS_DEALT, function() {
                self.deck.redrawCards();
            });
        },

        kadi: function() {

        },

        pick: function() {
            console.log("%s Picking a card ", this.name);
            SHOTGUN.fire(kadi.game.Events.PICK_CARD, [this, 1]);
            SHOTGUN.fire(kadi.game.Events.END_TURN, [this]);
        },

        move: function() {

        },
        handleCardSelected: function(card) {
            console.log("selected ", card.toS());
        },
        handleCardDeselected: function(card) {
            console.log("deselected ", card.toS())
        },
        display: function() {
             if (this.turnToPlay == false) {
                 $('.btn').attr("disabled", true);
             }
        },
        giveTurn : function() {
            this.turnToPlay = true;

        },
        endTurn : function() {
            this.turnToPlay = false;
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
            var fan = kadi.flatChineseFan(this.width(),kadi.game.CardUI.WIDTH,kadi.game.CardUI.MARGIN,this.cards.length,this.type == kadi.game.PlayerDeck.TYPE_A);
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
            var self = this;
            SHOTGUN.listen(kadi.game.Events.PICK_CARD, function(player, quantity) {
                self.giveCard(player, quantity);
            });
        },

        giveCard : function(player, quantity) {

        },

        display: function() {
            this.parent.appendChild(this.div);
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
            X: 300,
            Y: 200
        },
        construct : function() {
            this.parent.construct.apply(this, ['game', 'table_deck_div', 'table_deck']);
            this.cards = [];
            this.display();
        },

        addCard: function(card, flip) {
            this.cards.push(card);
            if (flip) {
                card.flip();
            }
            var pos = kadi.getRandomLocation(this.bBox(), 15, 10, 15);
            if (this.cards.length == 1)
                pos.rotate = 0;
            card.moveTo(pos.x, pos.y, pos.rotate);
        },

        bBox : function() {
            var topLeft = new kadi.Pos(kadi.game.TableDeck.X,kadi.game.TableDeck.Y);
            return new kadi.BBox(topLeft, kadi.game.TableDeck.WIDTH, kadi.game.TableDeck.HEIGHT);
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
        construct: function(player, vs) {
            this.id = me.GameUI.ID;
            this.me = new kadi.game.GamePlayerUI(player, new kadi.game.PlayerDeck(kadi.game.PlayerDeck.TYPE_A));

            this.opponents = _.collect(vs, function(opponent) {
               return new me.GamePlayerUI(opponent,new kadi.game.PlayerDeck(kadi.game.PlayerDeck.TYPE_B));
            });
            this.game = new me.Game(this.me,this.opponents);
        },

        display : function() {
            kadi.ui.disableLoading('game');
            $('.player').toggleClass('hidden');
            this.game.startGame();
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
