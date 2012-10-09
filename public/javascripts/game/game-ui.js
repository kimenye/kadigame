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
            UNHANDLED_ERROR: "unhandled-error",
            RESTART_GAME: "restart-game",
            RETURNED_CARDS: "returned-cards",
            LATE_KADI: "late-kadi"
        }
    });

    me.Game = JS.Class({
        construct: function(player, opponents) {
            this.me = player;
            this.opponents = opponents;
            this.players = this.opponents;
            if (kadi.isSomethingMeaningful(this.me))
                this.players.push(this.me);
            this.requestedSuite = null;
            this.pickingDeck = new kadi.game.PickingDeck();
            this.tableDeck = new kadi.game.TableDeck();
            this.noticeBoard = new kadi.game.NoticeBoard();
            this.requestedSuiteDeck = new kadi.game.RequestedSuiteNotification();
        },

        startGame: function() {
            var self = this;
            var starterIdx = kadi.coinToss(this.players);
            var starter = this.players[starterIdx];

            _.each(this.players, function(p) {
                p.initHandlers();
            });

            this.order = new me.PlayingOrder(this.players, starterIdx);
            this.dealCards();

            SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ this.order.current().name + " to start. " ]);
            SHOTGUN.listen(kadi.game.Events.PICK_CARD, function(player, num) {
                self.giveCard(player,num);
                if (player.onKADI) {
                    //need to check if we are still on kadi...
                    if (!player.canDeclareKADI()) {
                        player.kadi(false);
                    }
                }
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
                            c.hide();
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
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(),null,player],next.id);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                },1000);
            });
            SHOTGUN.listen(kadi.game.Events.SUITE_REQUESTED, function(player, suite) {
                self.requestedSuite = suite;
                self.progressPlay(player,kadi.game.RuleEngine.ACTION_NONE,[]);
            });

            SHOTGUN.listen(kadi.game.Events.FINISH, function(player) {
                self.order.end();
            });

            SHOTGUN.listen(kadi.game.Events.RESTART_GAME, function(winner) {
                _.each(self.players, function(p) {
                    p.reset();
                });

                self.tableDeck.reset();
                self.noticeBoard.reset();

                var starterIdx = kadi.coinToss(self.players);
                if (kadi.isSomethingMeaningful(winner)) {
                    var p = _.indexOf(self.players, function(p) { return p.eq(winner); });
                    if (p >= 0) {
                        starterIdx = p;
                    }
                }

                self.order = new me.PlayingOrder(self.players, starterIdx);
                self.dealCards();

                SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.current().name + " to start. " ]);
            });

            SHOTGUN.listen(kadi.game.Events.RETURNED_CARDS, function(cards) {
                _.each(cards, function(c) {
                    c.hide();
                    self.pickingDeck.returnCard(c);
                });
            });
        },

        progressPlay: function(player, action, playedCards) {
            var self = this;

            if(this.order.isPaused)
                return;

            _.delay(function() {
                if (action == kadi.game.RuleEngine.ACTION_NONE) {
                    self.order.next();
                    var next = self.order.current();
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(), self.requestedSuite, player],next.id);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                } else if (action == kadi.game.RuleEngine.ACTION_REVERSE) {
                    self.order.reverse();
                    var next = self.order.current();
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(),null, player],next.id);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                } else if (action == kadi.game.RuleEngine.ACTION_SKIP) {
                    var turnsToSkip = kadi.game.RuleEngine.calculateTurnsSkipped(playedCards);
                    _.each(_.range(turnsToSkip), function(idx) {
                        self.order.next();
                    });
                    self.order.next();
                    var next = self.order.current();
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(), null, player],next.id);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                } else if (action == kadi.game.RuleEngine.ACTION_PICK_OR_BLOCK) {
                    self.order.next();
                    var nextPlayer = self.order.current();
                    var canBlock = nextPlayer.canBlock();

                    if (!canBlock) {
                        self.order.next();
                        var next = self.order.current();
                        var num = kadi.game.RuleEngine.calculatePicking(playedCards);

                        SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ nextPlayer.name + " to pick " + num ]);
                        SHOTGUN.fire(kadi.game.Events.PICK_CARD, [nextPlayer,num]);
                        _.delay(function() {
                            SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(),null, player],next.id);
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
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(),null, player],next.id);
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
                if (ignoreA) {
                    action = kadi.game.RuleEngine.ACTION_NONE;
                }
                if (!wasOnKADI)
                    player.endTurn(action,cards);
                else {
                    console.log("%s has finished the game", player.name);
                    _.delay(function() {
                        SHOTGUN.fire(kadi.game.Events.FINISH, [player]);
                    }, 1000);
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

    return me;
})(window.kadi.game || {}, jQuery);