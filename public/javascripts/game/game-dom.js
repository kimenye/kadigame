window.kadi.game = (function(me, $, undefined){

    me.Events = JS.Class({
        statics : {
            CARD_SELECTED : "card-selected",
            CARD_DESELECTED: "card-deselected",
            PICK_CARD: "pick-card",
            CARDS_DEALT: "cards-dealt",
            END_TURN: "end-turn",
            RECEIVE_TURN: "receive-turn",
            ACTIVATE_CARD: "activate-card",
            DEACTIVATE_CARD: "deactivate-card",
            PLAY_CARDS: "play-cards"
        }
    });

    me.Game = JS.Class({
        construct: function(player, opponents) {
            this.me = player;
            this.opponents = opponents;
            this.players = this.opponents;
            this.players.push(this.me);
            this.pickingDeck = new kadi.game.PickingDeck();
            this.tableDeck = new kadi.game.TableDeck();
            this.ruleEngine = new kadi.game.RuleEngine();
        },

        startGame: function() {
            var self = this;
            var starter = kadi.coinToss(this.players);
            _.each(this.players, function(p) {
                p.initHandlers();
            });
            this.dealCards(this.me);

            SHOTGUN.listen(kadi.game.Events.PICK_CARD, function(player, num) {
                self.giveCard(player,num);
            });

            SHOTGUN.listen(kadi.game.Events.END_TURN, function(player) {
                self.giveNextPlayerTurn(player);
            });

            SHOTGUN.listen(kadi.game.Events.PLAY_CARDS, function(player, cards) {
                self.attemptPlay(player,cards);
            });
        },

        attemptPlay : function(player, cards) {
            var canPlay = this.ruleEngine.canPlay(cards,this.tableDeck.topCard());
            if (canPlay) {
                _.each(cards, function(card) {
                    card.deSelect();
                    card.active = false;
                    player.removeCard(card, true);
                    this.tableDeck.addCard(card);
                }, this);
                player.clearSelections();
                player.endTurn();
            }
        },

        giveNextPlayerTurn: function(player) {
            var nextPlayer = this.getNextTurn(player);
            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[],''+nextPlayer.id);
            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[nextPlayer],'deck');
        },

        getNextTurn: function(player) {
            return _.detect(this.players, function(p) {
                return p.id != player.id;
            })
        },

        giveCard: function(to,qty) {
            _.each(_.range(qty),function(){
                var card = this.pickingDeck.deal();
                to.addCard(card, true);
            },this);
        },

        dealCards: function(starter) {
            _.each(_.range(3), function(idx) {
                _.each(this.players, function(p) {
                    var card = this.pickingDeck.deal();
                    p.addCard(card);
                },this);
            },this);

            SHOTGUN.fire(kadi.game.Events.CARDS_DEALT,[]);
            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[],''+starter.id);
            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[starter], 'deck');

            var card = this.pickingDeck.deal();
            this.tableDeck.addCard(card, true);
        }
    });

    me.Player = JS.Class({
        construct : function(id, name,live) {
            this.id = id;
            this.name = name;
            this.live = live;
        },

        toS: function() {
            return this.id + " - " + this.name;
        }
    });

    me.GamePlayerUI = me.Player.extend({
        construct : function(player, deck) {
            this.parent.construct.apply(this, [player.id,player.name,player.live]);
            this.deck = deck;
            this.turnToPlay = false;
            this.selections = [];
        },
        getLocation: function() {
            return this.deck.type;
        },
        clearSelections: function() {
            this.selections = [];
        },
        addCard: function(card,redraw) {
            if (this.live)
                card.flip();
            this.deck.addCard(card);
            if (redraw)
                this.deck.redrawCards();
        },
        removeCard: function(card,redraw) {
            this.deck.removeCard(card);
            if (redraw)
                this.deck.redrawCards();
        },
        initHandlers: function() {
            $('.player.player' + this.getLocation()).toggleClass('hidden');
            var self = this;
            if (this.live) {
                SHOTGUN.listen(kadi.game.Events.CARD_SELECTED, function(card) {
                    self.handleCardSelected(card);
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

            SHOTGUN.listen(kadi.game.Events.RECEIVE_TURN, function() {
                if (self.live) {
                    self.activate(true);
                } else {
                    self.bot();
                }
            }, ''+this.id);
        },

        endTurn: function() {
            SHOTGUN.fire(kadi.game.Events.END_TURN, [this]);
            if (this.live)
            {
                this.activate(false);
            }
        },

        bot: function() {
            var self = this;
            _.delay(function() {
                self.pick();
            },1000);
        },

        kadi: function() {

        },

        pick: function() {
            console.log("%s Picking a card ", this.name);
            SHOTGUN.fire(kadi.game.Events.PICK_CARD, [this, 1]);
            this.endTurn();
        },

        move: function() {
            if (this.selections.length > 0) {
                this.activateActions(false);
                SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, this.selections]);
            }
        },
        handleCardSelected: function(card) {
            this.selections.push(card);
        },
        handleCardDeselected: function(card) {
            this.selections = _.reject(this.selections, function(c) {
                return c.id = card.id;
            },this);
        },
        activateActions : function(status) {
            $('.btn').attr("disabled", !status);
            if (status)
                $('.btn').removeClass('disabled');
        },
        activate: function(status) {
            if (this.live) {
                this.deck.activateCards(status);
                this.turnToPlay = status;
                $('.btn').attr("disabled", !status);
                if (status)
                    $('.btn').removeClass('disabled');
            }
        },
        display: function() {
             if (this.turnToPlay == false) {
                 $('.btn').attr("disabled", true);
             }
        },
        giveTurn : function() {
            this.turnToPlay = true;
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
            HEIGHT_H: 100,
            WIDTH_V: 100,
            HEIGHT_V: 400,
            Y_A: 500,
            Y_B: -20,
            X_A: 200,
            X_B: 200,
            Y_C: 150,
            X_C: 700,
            X_D: 0,
            Y_D: 150,
            TYPE_A: 'A',
            TYPE_B: 'B',
            TYPE_C: 'C',
            TYPE_D: 'D',
            typeFromIndex: function(index) {
                //locations on the table...
                //A - user who is playing
                //B - TOP
                //C - Right
                //D - Left
                var types = [kadi.game.PlayerDeck.TYPE_B,kadi.game.PlayerDeck.TYPE_C,kadi.game.PlayerDeck.TYPE_D];
                return types[index];
            },
            fromIndex : function(index) {
                return new me.PlayerDeck(me.PlayerDeck.typeFromIndex(index));
            }

        },
        construct: function(type) {
            this.type = type;
            this.parent.construct.apply(this, ['game', 'player_deck_div' + type, 'player_deck ' + type]);
            this.display();
            this.cards = [];
        },

        left: function() {
            if (this.type == kadi.game.PlayerDeck.TYPE_A || this.type == kadi.game.PlayerDeck.TYPE_B)
                return kadi.game.PlayerDeck.X_A;
            else if (this.type == kadi.game.PlayerDeck.TYPE_C)
                return kadi.game.PlayerDeck.X_C;
            else if (this.type == kadi.game.PlayerDeck.TYPE_D)
                return kadi.game.PlayerDeck.X_D;
        },

        top : function() {
            if (this.type == kadi.game.PlayerDeck.TYPE_A)
                return kadi.game.PlayerDeck.Y_A;
            else if (this.type == kadi.game.PlayerDeck.TYPE_B)
                return kadi.game.PlayerDeck.Y_B;
            else
                return kadi.game.PlayerDeck.Y_C;
        },

        width: function() {
            if (this.isHorizontal())
                return kadi.game.PlayerDeck.WIDTH_H;
            else
                return kadi.game.PlayerDeck.WIDTH_V;
        },

        height: function() {
            if (this.isHorizontal())
                return kadi.game.PlayerDeck.HEIGHT_H;
            else
                return kadi.game.PlayerDeck.HEIGHT_V;
        },

        activateCards: function(status) {
            _.each(this.cards, function(c) {
                c.active = status;
                if (!status && c.selected)
                {
                    c.selected = false
                    c.reset();
                }
            });
        },

        addCard: function(card) {
            this.cards.push(card);
            var self = this;
            var left = 0;
            var top = 0;
            var rotate = 0;
            if (this.isHorizontal()) {
                left = this.left() + kadi.centerInFrame(this.width(),kadi.game.CardUI.WIDTH); //center the card along the deck
                top = this.top();
            }
            else if (this.type == kadi.game.PlayerDeck.TYPE_C) {
                rotate = 90;
//                top = this.top() + kadi.centerInFrame(this.height(), kadi.game.CardUI.WIDTH) - 50;
                top = this.top() + 80;
                left = this.left();
            }
            card.moveTo(left,top, rotate);
        },

        isHorizontal : function() {
            return this.type == kadi.game.PlayerDeck.TYPE_A || this.type == kadi.game.PlayerDeck.TYPE_B;
        },

        isVertical: function() { return ! this.isHorizontal() },

        removeCard: function(card) {
            this.cards = _.reject(this.cards, function(c) {
                return c.id == card.id;
            })
        },

        redrawCards: function() {
            var fan = [];
            if (this.isHorizontal())
                fan = kadi.flatChineseFan(this.width(),kadi.game.CardUI.WIDTH,kadi.game.CardUI.MARGIN,this.cards.length,this.type == kadi.game.PlayerDeck.TYPE_A);
            else
                fan = kadi.flatVerticalFan(this.height(),kadi.game.CardUI.WIDTH,kadi.game.CardUI.MARGIN,this.cards.length,this.type == kadi.game.PlayerDeck.TYPE_D);

            if (this.isVertical()) {
                console.log("Num of blades : ", fan.length);
            }
            var self = this;
            _.each(fan, function(blade, idx) {
                var card = self.cards[idx];
                if (this.isVertical()) {
                    console.log("X: ", blade.x);
                }
                card.moveTo(self.left() + blade.x,null,blade.rotate);
            },this);
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
            var self = this;
            this.parent.construct.apply(this, ['game', 'picking_box_div', 'picking_box']);
            this.deck = kadi.game.Suite.getDeckOfCards();
            this.topLeft = function() { return new kadi.Pos(me.PickingDeck.X, me.PickingDeck.Y) };
            this.active = false;
            this.bBox = function() { return new kadi.BBox(this.topLeft(), me.PickingDeck.WIDTH, me.PickingDeck.HEIGHT) };
            this.display();
            SHOTGUN.listen(kadi.game.Events.PICK_CARD, function(player, quantity) {
                self.giveCard(player, quantity);
            });

            SHOTGUN.listen(kadi.game.Events.RECEIVE_TURN, function(player) {
                self.active = player.live;
            }, 'deck');
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
//            return this.deck.pop();
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

            if (kadi.isSomethingMeaningful(this.topCard())
                && this.cards.length > 1) {
                var top = this.topCard();
                var topZ = top.container().css('z-index');

                top.container().css('z-index', topZ-1);
                card.container().css('z-index', topZ+2);
            }
            card.moveTo(pos.x, pos.y, pos.rotate);
        },

        bBox : function() {
            var topLeft = new kadi.Pos(kadi.game.TableDeck.X,kadi.game.TableDeck.Y);
            return new kadi.BBox(topLeft, kadi.game.TableDeck.WIDTH, kadi.game.TableDeck.HEIGHT);
        },

        topCard: function() {
            return _.last(this.cards);
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

            this.opponents = [];
            _.each(vs, function(opponent, idx) {
                this.opponents.push(new me.GamePlayerUI(opponent,new kadi.game.PlayerDeck.fromIndex(idx)));
            },this);
            this.game = new me.Game(this.me,this.opponents);
        },



        display : function() {
            kadi.ui.disableLoading('game');
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
