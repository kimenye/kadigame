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
            PLAY_CARDS: "play-cards",
            BLOCK: "block-picking",
            MSG_RECEIVED: "msg-received",
            REJECT_MOVES: "reject-moves",
            REPLENISH_PICKING_CARDS: "replenish-picking-cards",
            REPLENISHED_CARDS: "replenished-cards",
            PLAYER_NOTIFICATION_UI: "player-notification-ui",
            ACCEPT_PICKING: "accept-picking",
            SUITE_REQUESTED: "suite-requested",
            HIDE_REQUESTED_SUITE: "hide-requested-suite",
            DISPLAY_REQUESTED_SUITE: "display-requested-suite",
            DECLARE_KADI: "declare-kadi",
            UNDECLARE_KADI: "undeclare-kadi",
            FINISH: "finish",
            UNHANDLED_ERROR: "unhandled-error"
        }
    });

    me.PlayingOrder = JS.Class({
        statics: {
            CLOCKWISE: 1,
            ANTI_CLOCKWISE: 0
        },
        construct: function(players, startIdx) {
            this.players = players;
            this.startIdx = startIdx;
            this.direction = me.PlayingOrder.CLOCKWISE;
            this.turnCount = 0;
            this.isPaused = false;
            this.pauseHandler = null;
            this.playerCount = this.players.length;
            this.begin();
        },
        begin: function() {
            this.currentIdx = this.startIdx;
        },
        current: function() {
            return this.players[this.currentIdx];
        },
        pause: function(handler) {
            this.pauseHandler = handler;
            this.isPaused = true;
        },
        unPause: function() {
            this.isPaused = false;
            this.pauseHandler = null;
        },
        executeHandler : function() {
            if (kadi.isSomethingMeaningful(this.pauseHandler)) {
                this.pauseHandler.callBack();
            }
        },
        peek: function() {
            var n = this.currentIdx;
            if (this.isClockwise()) {
                n += 1;
                if (n >= this.playerCount)
                    n = 0;
            }   else {
                n = Math.max(0, n -1 );
            }
            return this.players[n];
        },
        next: function() {
            if (!this.isPaused) {
                this.turnCount++;
                if (this.isClockwise()) {
                    var n = this.currentIdx + 1;
                    if (n >= this.playerCount)
                        n = 0;
                    this.currentIdx = n;
                } else {
                    var n = this.currentIdx - 1;
                    if (n < 0)
                        n = this.playerCount - 1;
                    this.currentIdx = n;
                }
            }
        },
        reverse: function() {
            if (!this.isPaused) {
                if (this.isClockwise())
                    this.direction = kadi.game.PlayingOrder.ANTI_CLOCKWISE;
                else
                    this.direction = kadi.game.PlayingOrder.CLOCKWISE;
                this.next();
            }
        },
        isClockwise: function() {
            return this.direction == kadi.game.PlayingOrder.CLOCKWISE;
        },
        isAntiClockwise: function() { return ! this.isClockwise() }
    });

    me.Game = JS.Class({
        construct: function(player, opponents) {
            this.me = player;
            this.opponents = opponents;
            this.players = this.opponents;
            this.players.push(this.me);
            this.requestedSuite = null;
            this.pickingDeck = new kadi.game.PickingDeck();
            this.tableDeck = new kadi.game.TableDeck();
            this.gameOver = false;
            window.picker = this.pickingDeck;
            this.ruleEngine = new kadi.game.RuleEngine();
            this.noticeBoard = new kadi.game.NoticeBoard();
            this.requestedSuiteDeck = new kadi.game.RequestedSuiteNotification();
            this.playersOnKadi = [];
        },

        startGame: function() {
            var self = this;
            var starterIdx = kadi.coinToss(this.players);
            var starter = this.players[starterIdx];
            _.each(this.players, function(p) {
                p.initHandlers();
            });

            this.order = new me.PlayingOrder(this.players, 3);
            this.dealCards();

            SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ this.order.current().name + " to start. " ]);
            SHOTGUN.listen(kadi.game.Events.PICK_CARD, function(player, num) {
                self.giveCard(player,num);
            });

            SHOTGUN.listen(kadi.game.Events.END_TURN, function(player, action, playedCards) {

                var paused = self.order.isPaused;
                if (!paused) {
                    self.progressPlay(player, action, playedCards);
                }
                else {
                    self.order.executeHandler();
                    SHOTGUN.fire(kadi.game.Events.REPLENISHED_CARDS, [player, action, playedCards]);
                }
            });

            SHOTGUN.listen(kadi.game.Events.REPLENISHED_CARDS, function(player, action, playedCards) {
                self.pickingDeck.replenished = false;
                self.order.unPause();
                SHOTGUN.fire(kadi.game.Events.END_TURN, [player, action, playedCards]);
            });

            SHOTGUN.listen(kadi.game.Events.PLAY_CARDS, function(player, cards, onKADI) {
                self.attemptPlay(player,cards, false, onKADI);
            });

            SHOTGUN.listen(kadi.game.Events.BLOCK, function(player, blockCards, pickingCards, add) {
                if (add)
                    self.attemptBlock(player,blockCards,pickingCards);
                else
                    self.attemptPlay(player, blockCards, true);
            });

            SHOTGUN.listen(kadi.game.Events.REPLENISH_PICKING_CARDS, function() {

                var pauseHandler = new kadi.Handler(function() {
                    var peek = self.order.peek();
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ "Shuffling cards... " + peek.name + " will be next to play" ]);
                    var cards = self.tableDeck.replenishCards();

                    if (cards.length > 0) {
                        //we have cards to recycle
                        cards = _.shuffle(cards);
                        _.each(cards, function(c) {
                            c.flip();
                            self.pickingDeck.returnCard(c);
                        });
                    }

                }, self);
                self.order.pause(pauseHandler);

            });

            SHOTGUN.listen(kadi.game.Events.ACCEPT_PICKING, function(player, pickingCards) {
                self.order.next();
                var next = self.order.current();
                var num = kadi.game.RuleEngine.calculatePicking(pickingCards);

                SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ player.name + " to pick " + num ]);
                SHOTGUN.fire(kadi.game.Events.PICK_CARD, [player,num]);
                _.delay(function() {
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ next.name + "'s turn to play." ]);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard()],next.id);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                },1000);
            });
            SHOTGUN.listen(kadi.game.Events.SUITE_REQUESTED, function(player, suite) {
                self.requestedSuite = suite;
                self.progressPlay(player,kadi.game.RuleEngine.ACTION_NONE,[]);
            });

            SHOTGUN.listen(kadi.game.Events.DECLARE_KADI, function(player) {
                SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [player.name + " is on KADI!"]);
                self.playersOnKadi.push(player);
            });

            SHOTGUN.listen(kadi.game.Events.UNDECLARE_KADI, function(player) {
                self.playersOnKadi = _.reject(self.playersOnKadi, function(p) { return p.eq(player); });
            });

            SHOTGUN.listen(kadi.game.Events.FINISH, function(player) {

            });
        },

        progressPlay: function(player, action, playedCards) {
            var self = this;
            _.delay(function() {
                if (action == kadi.game.RuleEngine.ACTION_NONE) {
                    self.order.next();
                    var next = self.order.current();
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ next.name + "'s turn to play." ]);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(), self.requestedSuite],next.id);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                } else if (action == kadi.game.RuleEngine.ACTION_REVERSE) {
                    self.order.reverse();
                    var next = self.order.current();
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ next.name + "'s turn to play." ]);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard()],next.id);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                } else if (action == kadi.game.RuleEngine.ACTION_SKIP) {
                    self.order.next();
                    self.order.next();
                    var next = self.order.current();
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ next.name + "'s turn to play." ]);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard()],next.id);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                } else if (action == kadi.game.RuleEngine.ACTION_PICK_OR_BLOCK) {
                    self.order.next();
                    var nextPlayer = self.order.current();
                    var canBlock = nextPlayer.canBlock();

                    if (!canBlock) {
                        self.order.next();
                        var next = self.order.current();
                        var num = kadi.game.RuleEngine.calculatePicking(playedCards)

                        SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ nextPlayer.name + " to pick " + num ]);
                        SHOTGUN.fire(kadi.game.Events.PICK_CARD, [nextPlayer,num]);
                        _.delay(function() {
                            SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ next.name + "'s turn to play." ]);
                            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard()],next.id);
                            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                        },1000);
                    }
                    else {
                        if (nextPlayer.isBot()) {
                            nextPlayer.block(playedCards);
                        }
                        else {
                            SHOTGUN.fire(kadi.game.Events.PLAYER_NOTIFICATION_UI, [nextPlayer, action, playedCards]);
                        }
                    }
                } else if (action == kadi.game.RuleEngine.ACTION_PICK_SUITE) {
                    if (player.isBot()) {
                        var suite = kadi.game.Strategy.askFor(player.cards());
                        var suiteName = kadi.game.Suite.getSuiteName(suite);

                        self.requestedSuite = suite;
                        SHOTGUN.fire(kadi.game.Events.DISPLAY_REQUESTED_SUITE, [suite]);
                        SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ player.name + " has requested for " + suiteName ]);
                        self.progressPlay(player,kadi.game.RuleEngine.ACTION_NONE,[]);
                    } else {
                        SHOTGUN.fire(kadi.game.Events.PLAYER_NOTIFICATION_UI, [player, action]);
                    }
                }
                else {
                    SHOTGUN.fire(kadi.game.Events.PICK_CARD, [player,1]);
                    self.order.next();
                    var next = self.order.current();
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ next.name + "'s turn to play." ]);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard()],next.id);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                }
            }, 1000);
        },

        attemptBlock: function(player,blockCards,pickingCards) {
            _.each(blockCards, function(card) {
                SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ player.name + " played " + card.toS()]);
                card.deSelect();
                card.active = false;
                player.removeCard(card, true);
                this.tableDeck.addCard(card, !player.live);
                player.clearSelections();
                //We already know the action
                var newPickingCards = pickingCards.concat(blockCards);
                player.endTurn(kadi.game.RuleEngine.ACTION_PICK_OR_BLOCK, newPickingCards);
            }, this);
        },

        attemptPlay : function(player, cards, isBlock, wasOnKADI) {

            var meetsRequestedSuite = true;
            var clearRequested = false;
            if (kadi.isSomethingMeaningful(this.requestedSuite)) {
                clearRequested = true;
                meetsRequestedSuite = kadi.game.RuleEngine.canFollowRequestedSuite(cards,this.requestedSuite);
            }

            var canPlay = kadi.game.RuleEngine.canPlay(cards,this.tableDeck.topCard());
            if (canPlay && meetsRequestedSuite) {
                if (clearRequested) {
                    this.requestedSuite = null;
                    SHOTGUN.fire(kadi.game.Events.HIDE_REQUESTED_SUITE, []);
                }
                _.each(cards, function(card) {
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ player.name + " played " + card.toS()]);
                    card.deSelect();
                    card.active = false;
                    player.removeCard(card, true);
                    this.tableDeck.addCard(card, !player.live);
                }, this);
                player.clearSelections();
                var action = kadi.game.RuleEngine.actionRequired(cards);
                var ignoreA = kadi.getVal(isBlock);
                if (ignoreA)
                {
                    action = kadi.game.RuleEngine.ACTION_NONE;
                }
                if (!wasOnKADI)
                    player.endTurn(action,cards);
                else {
                    console.log("%s has finished the game", player.name);
                    SHOTGUN.fire(kadi.game.Events.FINISH, [player]);
                }
            } else {
                SHOTGUN.fire(kadi.game.Events.REJECT_MOVES, [cards], player.id);
            }
        },

        giveCard: function(to,qty) {
            _.each(_.range(qty),function(){
                var card = this.pickingDeck.deal();
                to.addCard(card, true);
            },this);
        },

        dealCards: function() {
            _.each(_.range(3), function(idx) {
                _.each(this.players, function(p) {
                    var card = this.pickingDeck.deal();
                    p.addCard(card);
                },this);
            },this);

            var card = this.pickingDeck.cut();
            this.tableDeck.addCard(card, true);

            SHOTGUN.fire(kadi.game.Events.CARDS_DEALT,[]);
            var starter = this.order.current();
            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[this.tableDeck.topCard()],starter.id);
            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[starter], 'deck');
        }
    });

    me.Player = JS.Class({
        construct : function(id, name,live) {
            this.id = id;
            this.name = name;
            this.live = live;
            this.onKADI = false;
        },

        eq: function(other) {
            return this.id == other.id && this.name == other.name;
        },

        toS: function() {
            return this.id + " - " + this.name;
        },

        isBot: function() {
            return !this.live;
        }
    });

    me.GamePlayerUI = me.Player.extend({
        statics: {
            BOT_DELAY: 2000
        },
        construct : function(player, deck) {
            this.parent.construct.apply(this, [player.id,player.name,player.live]);
            this.deck = deck;
            this.turnToPlay = false;
            this.blockMode = false;
            this.cardsToPick = [];
            this.selections = [];
            if (player.live) {
                this.notification = new kadi.game.PlayerNotification();
            }
        },
        getLocation: function() {
            return this.deck.type;
        },
        clearSelections: function() {
            this.selections = [];
        },
        cards: function() {
            return this.deck.cards;
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
        canBlock: function() {
            return kadi.game.RuleEngine.canBlock(this.deck.cards);
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

                SHOTGUN.listen(kadi.game.Events.REJECT_MOVES, function(cards) {
                    self.activateActions(true);
                }, this.id);

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

            SHOTGUN.listen(kadi.game.Events.RECEIVE_TURN, function(card, requestedSuite) {
                if (self.live) {
                    self.activate(true);
                } else {
                    _.delay(function() {
                        self.bot(card, requestedSuite);
                    },kadi.game.GamePlayerUI.BOT_DELAY);
                }
            }, this.id);
        },
        endTurn: function(action,playedCards) {
            SHOTGUN.fire(kadi.game.Events.END_TURN, [this, action, playedCards]);
            //check if the user can declare KADI...
            var canDeclare = kadi.game.RuleEngine.canDeclareKADI(this.cards());
            if (this.live)
            {
                this.activate(false);
                if (canDeclare) {
                    $('.btn-kadi').attr('disabled', false);
                    $('.btn-kadi').removeClass('disabled');
                }
            } else {
                if (canDeclare) {
                    this.onKADI = true;
                    _.each(this.cards(), function(c) {

                    });
                }
            }
        },
        bot: function(card, requestedSuite) {
            //TODO: give the players some thinking time...
            var cards = this.deck.cards;
            if (kadi.isSomethingMeaningful(requestedSuite)) {
                var canPlayWithRequestedSuite = kadi.game.RuleEngine.canMeetMatchingSuite(cards, requestedSuite);
                if (!canPlayWithRequestedSuite) {
                    this.pick();
                }
                else
                {
                    var move = kadi.game.Strategy.bestMoveForRequestedSuite(cards,requestedSuite);
                    SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, move, self.onKADI]);
                }

            } else {
                var canPlay = kadi.game.RuleEngine.canPlay(cards, card);
                if (canPlay) {
                    var groups = kadi.game.RuleEngine.group(cards,card);
                    if (groups.length == 0) {
                        //look for a possible move
                        var moves = kadi.game.RuleEngine.possibleMoves(card, cards);
                        var move = _.first(moves);
                        SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, move.cards, self.onKADI]);
                    } else {
                        var move = _.first(groups);
                        SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, move, self.onKADI]);
                    }
                }
                else
                    this.pick();
            }
        },
        block: function(pickingCards) {
            //the blocking strategy is to add a single picking card of the highest value
            //
            var hasPickingCard = kadi.containsPickingCard(this.deck.cards);

            //TODO: Never block if you have a picking card and the next player is on KADI
            if (hasPickingCard) {
                var highestCard = kadi.highestPickingCard(this.deck.cards);
                SHOTGUN.fire(kadi.game.Events.BLOCK, [this, [highestCard], pickingCards, true]);
            } else {
                var ace = _.detect(this.deck.cards, function(c) { return c.rank == kadi.game.Card.ACE });
                SHOTGUN.fire(kadi.game.Events.BLOCK, [this, [ace], pickingCards, false]);
            }
        },
        kadi: function() {

        },
        pick: function() {
            SHOTGUN.fire(kadi.game.Events.PICK_CARD, [this, 1]);
            this.endTurn(kadi.game.RuleEngine.ACTION_NONE, []);
        },
        move: function() {
            if (this.blockMode) {
                if (kadi.game.RuleEngine.isValidBlockingMove(this.selections)) {
                    var ace = kadi.containsCardOfRank(this.selections, kadi.game.Card.ACE);

                    $('.btn-move').html('Move');
                    SHOTGUN.fire(kadi.game.Events.BLOCK, [this, this.selections, this.cardsToPick, !ace]);
                    this.activate(false);
                    this.blockMode = false;
                    this.cardsToPick = [];
                }
            }
            else
            {
                if (this.selections.length > 0) {
                    this.activateActions(false);
                    SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, this.selections]);
                }
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
        activateForBlocking: function(pickingCards) {
            if (this.live) {
                $('.btn-kadi').attr('disabled', true);

                $('.btn-move').attr('disabled', false);
                $('.btn-move').html('Block :-)');

                this.deck.activatePickingCards();
                this.blockMode = true;
                this.cardsToPick = pickingCards;
                this.turnToPlay = true;
            }
        },
        activate: function(status) {
            if (this.live) {
                this.deck.activateCards(status);
                this.turnToPlay = status;
                $('.btn-move').attr("disabled", !status);
                if (status)
                    $('.btn-move').removeClass('disabled');
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
            ROTATE_V: 90,
            Y_A: 500,
            Y_B: -20,
            X_A: 200,
            X_B: 200,
            Y_C: 100,
            X_C: 700,
            X_D: 0,
            Y_D: 100,
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
            if (this.isHorizontal())
                return kadi.game.PlayerDeck.X_A;
            else if (this.isRight())
                return kadi.game.PlayerDeck.X_C;
            else if (this.isLeft())
                return kadi.game.PlayerDeck.X_D;

        },

        top : function() {
            if (this.isBottom())
                return kadi.game.PlayerDeck.Y_A;
            else if (this.isTop())
                return kadi.game.PlayerDeck.Y_B;
            else if (this.isRight())
                return kadi.game.PlayerDeck.Y_C;
            else if (this.isLeft()) {
                return kadi.game.PlayerDeck.Y_D;
            }
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

        activatePickingCards: function() {
            _.each(this.cards, function(c) {
                if (c.isPickingCard() || c.isAce()) {
                    c.active = true;
                }
                else
                {
                    c.active = false;
                    c.reset();
                }
            });
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

        isTop: function() {
            return this.type == kadi.game.PlayerDeck.TYPE_B;
        },

        isBottom: function() {
            return this.type == kadi.game.PlayerDeck.TYPE_A;
        },

        isLeft: function() {
            return this.type == kadi.game.PlayerDeck.TYPE_D;
        },

        isRight: function() {
            return this.type == kadi.game.PlayerDeck.TYPE_C;
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

        hasCards: function() {
            return this.cards.length > 0;
        },

        addCard: function(card) {
            this.cards.push(card);
            var self = this;
            var left = 0;
            var top = 0;
            var rotate = 0;
            var origin = null;
            if (this.isHorizontal()) {
                left = this.left() + kadi.centerInFrame(this.width(),kadi.game.CardUI.WIDTH); //center the card along the deck
                top = this.top();
            }
            else {
                top = this.top() + kadi.centerInFrame(this.height(), kadi.game.CardUI.WIDTH);
                origin = kadi.Pos.ORIGIN_RESET;
                rotate = 90;
                left = this.left() + (this.isRight() ? kadi.game.CardUI.LENGTH : kadi.game.CardUI.WIDTH);
            }
            card.moveTo(left,top, rotate, origin);
        },

        redrawCards: function(init) {
            if (this.hasCards()) {
                var fan = [];
                if (this.isVertical()) {
                    var init = kadi.centerInFrame(this.height(), kadi.game.CardUI.WIDTH) +  this.top();
                    fan = kadi.chineseFan(this.height(), this.top(), kadi.game.CardUI.WIDTH, this.cards.length, 5, this.isLeft());
                    _.each(fan, function (blade, idx) {
                        var card = this.cards[idx];
                        var posY = init + blade.y;
                        var rotate = kadi.game.PlayerDeck.ROTATE_V + blade.rotate;
                        card.moveTo(blade.x, posY, rotate);
                    }, this);
                }
                else if (this.isHorizontal())
                {
                    fan = kadi.flatChineseFan(this.width(),kadi.game.CardUI.WIDTH,kadi.game.CardUI.MARGIN,this.cards.length,this.type == kadi.game.PlayerDeck.TYPE_A);
                    _.each(fan, function(blade, idx) {
                        var card = this.cards[idx];
                        card.moveTo(this.left() + blade.x,null,blade.rotate);
                    }, this);
                }
            }
        }
    })

    me.PickingDeck = me.Box.extend({
        statics : {
            WIDTH:  150,
            HEIGHT: 200,
            X: 500,
            Y: 200,
            REPLENISH_THRESHOLD: 10
        },
        construct : function() {
            var self = this;
            this.parent.construct.apply(this, ['game', 'picking_box_div', 'picking_box']);
            this.deck = kadi.game.Suite.getDeckOfCards();
            this.topLeft = function() { return new kadi.Pos(me.PickingDeck.X, me.PickingDeck.Y) };
            this.active = false;
            this.replenished = false;
            this.activePlayer = null;
            this.bBox = function() { return new kadi.BBox(this.topLeft(), me.PickingDeck.WIDTH, me.PickingDeck.HEIGHT) };
            this.display();

            self.node().css('z-index', 6000);
            this.node().hover(function() {
                if (self.active) {
                    self.node().css( 'cursor', 'pointer' );
                }
            }, function() {
                if (self.active && !self.selected) {
                    self.node().css( 'cursor', 'default' );
                }
            });

            this.node().click(function() {
                if (self.active && kadi.isSomethingMeaningful(self.activePlayer)) {
                    self.activePlayer.pick();
                }
            });

            SHOTGUN.listen(kadi.game.Events.RECEIVE_TURN, function(player) {
                self.active = player.live;
                self.activePlayer = player; //TODO: this is still tightly coupled, you need to pass an event to the game
            }, 'deck');
        },

        returnCard: function(card) {
            var pos = kadi.getRandomLocation(this.bBox(), 10, 5, 10);
            card.container().css('z-index', kadi.game.TableDeck.Z);
            card.moveTo(pos.x, pos.y, pos.rotate);
            this.deck.push([card]); //TODO: to change when we do shift / pop
        },

        giveCardTo: function(card, player) {
            var card = _.find(this.deck, function(c) {
                return c.eq(card);
            });

            if (kadi.isSomethingMeaningful(card)) {
                player.addCard(card,true);
            }
        },

        display: function() {
            this.parent.appendChild(this.div);
            var positions = kadi.randomizeCardLocations(this.deck.length, this.bBox());
            _.each(this.deck, function(card,idx) {
                var pos = positions[idx];
                card.display(me.GameUI.ID, pos.x, pos.y, pos.rotate);
            });
        },

        numCards: function() {
            return this.deck.length;
        },

        cut: function() {
            var canStart = false;
            var card = null;
            do
            {
                var card = this.deck.shift();
                canStart = kadi.game.RuleEngine.canStart(card);
                if (!canStart)
                    this.deck.push(card);
            }
            while(!canStart)
            return card;
        },

        deal: function() {
            if (this.deck.length <= kadi.game.PickingDeck.REPLENISH_THRESHOLD && !this.replenished) {
                this.replenished = true;
                SHOTGUN.fire(kadi.game.Events.REPLENISH_PICKING_CARDS,[]);
            }
            return this.deck.shift();
//            return this.deck.pop();
        }
    });

    me.RequestedSuiteNotification = me.Box.extend({
        statics: {
            WIDTH: 100,
            HEIGHT: 136
        },
        construct: function() {
            this.parent.construct.apply(this, ['game', 'requested_suite_div', 'requested_suite hidden']);
            this.display();
            var self = this;
            SHOTGUN.listen(kadi.game.Events.DISPLAY_REQUESTED_SUITE, function(suite) {
                self.show(suite);
            });

            SHOTGUN.listen(kadi.game.Events.HIDE_REQUESTED_SUITE, function() {
                self.hide();
            });
        },

        hide: function() {
            $(this.suiteHolder).remove();
            this.suiteHolder = null;
            $(this.div).transition({
                opacity: 0,
                scale: 1
            }, 500, 'snap');
        },

        show: function(suite) {
            $('.requested_suite').removeClass('hidden');

            if (kadi.isSomethingMeaningful(this.suiteHolder)) {
                $(this.suiteHolder).remove();
                this.suiteHolder = null;
            }

            this.suiteHolder = kadi.createDiv('suite_holder', 'suite_holder_div');
            var symbol = kadi.game.Suite.getSuiteSymbol(suite);
            var label = kadi.createSpan(symbol, "suite " + suite + " " + kadi.game.Suite.getColorClass(suite,"") + " larger", null);

            this.suiteHolder.appendChild(label);
            this.div.appendChild(this.suiteHolder);

            $(this.div).transition({
                opacity: 0.5,
                scale: 0.6
            }, 1000, 'snap');
        }
    });

    me.TableDeck = me.Box.extend({
        statics: {
            WIDTH: 150,
            HEIGHT: 200,
            X: 300,
            Y: 200,
            Z: 5000,
            MIN_CARDS: 5
        },
        construct : function() {
            this.parent.construct.apply(this, ['game', 'table_deck_div', 'table_deck']);
            this.cards = [];
            this.highestCard = kadi.game.TableDeck.Z;
            this.display();
        },

        addCard: function(card, flip) {
            this.cards.push(card);
            this.highestCard += 1;
            card.container().css('z-index', this.highestCard);

            var pos = kadi.getRandomLocation(this.bBox(), 15, 10, 15);
            if (this.cards.length == 1)
                pos.rotate = 0;

            card.moveTo(pos.x, pos.y, pos.rotate);
            if (flip) {
                card.flip();
            }
        },

        replenishCards: function() {
            if (this.numCards() >= kadi.game.TableDeck.MIN_CARDS) {
                var availCards = this.numCards();
                var cardsToPick = availCards - kadi.game.TableDeck.MIN_CARDS;
                var cardsToRecycle = _.first(this.cards,cardsToPick);
                var remaining = _.rest(this.cards,cardsToPick);
                this.cards = remaining;
                return cardsToRecycle;
            }
            return [];
        },

        bBox : function() {
            var topLeft = new kadi.Pos(kadi.game.TableDeck.X,kadi.game.TableDeck.Y);
            return new kadi.BBox(topLeft, kadi.game.TableDeck.WIDTH, kadi.game.TableDeck.HEIGHT);
        },

        numCards: function() {
            return this.cards.length;
        },

        topCard: function() {
            return _.last(this.cards);
        }
    });

    me.Message = JS.Class({
        construct: function(idx, text) {
            this.idx = idx;
            this.text = text;
        }
    });

    me.NoticeBoard = me.Box.extend({
        statics: {
            WIDTH: 125,
            HEIGHT: 175,
            X: 140,
            Y: 290
        },
        construct : function() {
            this.parent.construct.apply(this, ['game', 'notification_div', 'notification']);
            var self = this;
            this.display();

            window.node = this.node();
            this.node().transition({ rotate: '20 deg' }, 500, 'snap');
            this.messages = [];
            var linesDiv = document.createElement("DIV");
            linesDiv.className = "lines";
            this.div.appendChild(linesDiv);

            var ul = document.createElement("UL");
            ul.className = "list";
            this.listDiv = ul;
            this.ctr = 0;

            this.div.appendChild(ul);

            SHOTGUN.listen(kadi.game.Events.MSG_RECEIVED, function(text) {
                self.log(text);
            });
        },

        log: function(text) {
            var li = document.createElement("LI");
            this.ctr += 1;
            li.id = "msg-" + this.ctr;
            var txt = kadi.createSpan(text);
            li.appendChild(txt);
            if (this.ctr > 2) {
                var earliest = this.ctr - 2;
                var old = document.getElementById('msg-' + earliest);
                $(old).remove();
            }
            this.listDiv.appendChild(li);
        }
    });

    me.PlayerNotification = me.Box.extend({
        statics: {
            WIDTH: 250,
            HEIGHT: 60
        },
        construct : function() {
            var self = this;
            this.parent.construct.apply(this, ['game', 'player_notification_div', 'player_notification hidden']);
            this.display();
            $(this.div).css('left', kadi.centerInFrame(800, me.PlayerNotification.WIDTH));
            $(this.div).css('top', 600);
            $(this.div).css('z-index',8001);

            this.overlay = kadi.createDiv('overlay hidden', 'notification_overlay');
            this.parent.appendChild(this.overlay);

            SHOTGUN.listen(kadi.game.Events.PLAYER_NOTIFICATION_UI, function(player, action, playedCards) {
                if (action == kadi.game.RuleEngine.ACTION_PICK_OR_BLOCK) {
                    self.showBlock(player, playedCards);
                } else if (action == kadi.game.RuleEngine.ACTION_PICK_SUITE) {
                    self.showSuitePicker(player);
                }
            });

            SHOTGUN.listen(kadi.game.Events.FINISH, function(player) {
                self.showPlayAgain(player);
            });

            SHOTGUN.listen(kadi.game.Events.UNHANDLED_ERROR, function(err) {
                self.showOverlay();
            });
        },
        showOverlay: function() {
            $(this.overlay).removeClass('hidden');
        },

        hideOverlay: function() {
            $(this.overlay).addClass('hidden');
        },

        showPlayAgain: function(player) {
            this.showOverlay();
        },

        showSuitePicker: function(player) {
            var self = this;
            this.showOverlay();

            this.suitePicker = kadi.createDiv("suite_picker btn-group button_holder", "suitePickerDialog");

            var heartsButton = document.createElement("button");
            heartsButton.className = "red btn btn-large hearts";
            heartsButton.innerHTML = kadi.game.Suite.getSuiteSymbol(kadi.game.Suite.HEARTS);
            $(heartsButton).click(function() {
                self.select(kadi.game.Suite.HEARTS, player);
            });

            var spadesButton = document.createElement("button");
            spadesButton.className = "black btn btn-large spades";
            spadesButton.innerHTML = kadi.game.Suite.getSuiteSymbol(kadi.game.Suite.SPADES);
            $(spadesButton).click(function() {
                self.select(kadi.game.Suite.SPADES, player);
            });

            var diamondsButton = document.createElement("button");
            diamondsButton.className = "red btn btn-large diamonds";
            diamondsButton.innerHTML = kadi.game.Suite.getSuiteSymbol(kadi.game.Suite.DIAMONDS);
            $(diamondsButton).click(function() {
                self.select(kadi.game.Suite.DIAMONDS, player);
            });

            var clubsButton = document.createElement("button");
            clubsButton.className = "black btn btn-large clubs";
            clubsButton.innerHTML = kadi.game.Suite.getSuiteSymbol(kadi.game.Suite.CLUBS);
            $(clubsButton).click(function() {
                self.select(kadi.game.Suite.CLUBS, player);
            });

            var anyButton = document.createElement("button");
            anyButton.className = "btn btn-large any";
            anyButton.innerHTML = "Any";
            $(anyButton).click(function() {
                self.select(kadi.game.Suite.ANY, player);
            });


            this.suitePicker.appendChild(heartsButton);
            this.suitePicker.appendChild(spadesButton);
            this.suitePicker.appendChild(diamondsButton);
            this.suitePicker.appendChild(clubsButton);
            this.suitePicker.appendChild(anyButton);

            this.div.appendChild(this.suitePicker);

            $(this.div).removeClass('hidden');

            var top = 600 - me.PlayerNotification.HEIGHT;
            $(this.div).transition({
                top: top + "px"
            }, 500, 'snap');
        },

        select: function(suite, player) {
            var self = this;
            this.hideOverlay();
            var top = 600;
            $(this.div).transition({
                top: top + "px"
            }, 500, 'snap', function() {
                $(self.div).addClass('hidden');
                $(self.suitePicker).remove();
                self.suitePicker = null;

                SHOTGUN.fire(kadi.game.Events.DISPLAY_REQUESTED_SUITE, [suite]);
                SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ player.name + " has requested for " + kadi.game.Suite.getSuiteName(suite) ]);
                SHOTGUN.fire(kadi.game.Events.SUITE_REQUESTED, [player, suite]);
            });
        },

        showBlock: function(player, playedCards) {
            var self = this;
            this.showOverlay();
            if (kadi.isSomethingMeaningful(this.blockDialog)) {
                $(this.blockDialog).remove();
                this.blockDialog = null;
            }
            var numToPick = kadi.game.RuleEngine.calculatePicking(playedCards);

            this.blockDialog = kadi.createDiv("pick_or_block btn-group button_holder", "pickOrBlockDialog");

            var pickButton = document.createElement("button");

            pickButton.className = "btn btn-danger btn-disabled";
            pickButton.innerHTML = "Pick " + numToPick + " :-( ";

            var blockButton = document.createElement("button");

            blockButton.className = "btn btn-success";
            blockButton.innerHTML = "Block :-)";

            this.blockDialog.appendChild(blockButton);
            this.blockDialog.appendChild(pickButton);

            $(blockButton).click(function() {
                $(blockButton).addClass('disabled');
                $(pickButton).addClass('disabled');
                self.hideBlock(false, player, playedCards);
            });

            $(pickButton).click(function() {
                $(blockButton).addClass('disabled');
                $(pickButton).addClass('disabled');
                self.hideBlock(true, player, playedCards);
            });

            this.div.appendChild(this.blockDialog);

            $(this.div).removeClass('hidden');

            var top = 600 - me.PlayerNotification.HEIGHT;
            $(this.div).transition({
                top: top + "px"
            }, 500, 'snap');
        },

        hideBlock: function(accept, player, pickingCards) {
            var self = this;
            this.hideOverlay();
            var top = 600;
            $(this.div).transition({
                top: top + "px"
            }, 500, 'snap', function() {
                $(self.div).addClass('hidden');
                $(self.blockDialog).remove();
                self.blockDialog = null;

                if (accept) {
                    SHOTGUN.fire(kadi.game.Events.ACCEPT_PICKING, [player, pickingCards]);
                } else {
                    //TODO: Tightly coupled. Use an event
                    player.activateForBlocking(pickingCards);
                }
            });
        },

        showSuiteSelector: function(title) {

            var spades = kadi.game.Suite.getSuiteDiv(kadi.game.Suite.SPADES);
            var diamonds = kadi.game.Suite.getSuiteDiv(kadi.game.Suite.DIAMONDS);
            var hearts = kadi.game.Suite.getSuiteDiv(kadi.game.Suite.HEARTS);
            var clubs = kadi.game.Suite.getSuiteDiv(kadi.game.Suite.CLUBS);

            this.div.appendChild(spades);
            this.div.appendChild(hearts);
            this.div.appendChild(clubs);
            this.div.appendChild(diamonds);

            $(this.div).removeClass('hidden');

            var top = 600 - me.PlayerNotification.HEIGHT;
            $(this.div).transition({
                top: top + "px"
            }, 500, 'snap');
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