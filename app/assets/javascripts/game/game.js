window.kadi = (function(me, $, undefined){

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
            this.begin();
        },
        playerCount: function() {
            return this.players.length;
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
        finish: function(player) {
            this.players = _.reject(this.players, function(p) { return p.eq(player); }, this);
        },
        end: function() {
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
                if (n >= this.playerCount())
                    n = 0;
            }   else {
                n = Math.max(0, n -1 );
            }
            return this.players[n];
        },
        turn: function() {
            var n = this.current();
            return n.live? "Your turn to play" : this.formatTurn(n.name);
        },
        formatTurn: function(name) {
            if (name.charAt(name.length - 1) == "s") {
                return name + "' turn to play";
            }
            else
                return name + "'s turn to play";
        },
        next: function() {
            if (!this.isPaused) {
                this.turnCount++;
                if (this.isClockwise()) {
                    var n = this.currentIdx + 1;
                    if (n >= this.playerCount())
                        n = 0;
                    this.currentIdx = n;
                } else {
                    var n = this.currentIdx - 1;
                    if (n < 0)
                        n = this.playerCount() - 1;
                    this.currentIdx = n;
                }
            }
        },
        reverse: function() {
            if (!this.isPaused) {
                if (this.isClockwise())
                    this.direction = kadi.PlayingOrder.ANTI_CLOCKWISE;
                else
                    this.direction = kadi.PlayingOrder.CLOCKWISE;
                this.next();
            }
        },
        isClockwise: function() {
            return this.direction == kadi.PlayingOrder.CLOCKWISE;
        },
        isAntiClockwise: function() { return ! this.isClockwise() }
    });

    me.GameContext = JS.Class({
        construct: function(topCard, requestedSuite, previousPlayer) {
            this.topCard = topCard;
            this.requestedSuite = requestedSuite;
            this.previousPlayer = previousPlayer;
        },

        previousPlayerIsLive: function() {
            return kadi.isSomethingMeaningful(this.previousPlayer) && this.previousPlayer.live;
        }
    });

    me.GameOptions = JS.Class({
        statics: {
            MODE_FIRST_TO_WIN: "first-to-win",
            MODE_ELIMINATION: "elimination",
            ONE_CARD_KADI: "one-card-kadi",
            ANY_CARDS_KADI: "any-cards-kadi",
            PICKING_MODE_TOP_ONLY: "only-pick-the-top-card",
            PICKING_MODE_ALL : "pick-all-the-cards"
        },

        construct: function(gameEndMode, kadiMode, pickingMode) {
            this.gameEndMode = gameEndMode;
            this.kadiMode = kadiMode;
            this.pickingMode = pickingMode;
        },

        isEliminationMode: function() {
            return this.gameEndMode == me.GameOptions.MODE_ELIMINATION;
        },

        isFirstToWin: function() {
            return !this.isEliminationMode();
        },

        canFinishWithMultipleCards: function() {
            return this.kadiMode == me.GameOptions.ANY_CARDS_KADI;
        },

        mustFinishWithOnlyOneCard: function() {
            return !this.canFinishWithMultipleCards();
        },

        canPickOnlyTheTopCard: function() {
            return this.pickingMode == me.GameOptions.PICKING_MODE_TOP_ONLY;
        },

        mustPickAllTheCards: function() {
            return !this.canPickOnlyTheTopCard();
        }
    });

    me.Game = JS.Class({
        construct: function(player, opponents, options) {
            this.me = player;
            this.options = options;
            this.opponents = opponents;
            this.players = this.opponents;
            this.original = this.players;
            if (this.hasLivePlayer())
                this.players.push(this.me);
            this.requestedSuite = null;
            this.initComponents();
            this.cardless = 0;
            this.turnsToSkip = 0;
        },

        initComponents: function() {
            this.pickingDeck = new kadi.PickingDeck(kadi.Suite.getDeckOfCards());
            this.tableDeck = new kadi.TableDeck();
        },

        hasLivePlayer: function() {
            return kadi.isSomethingMeaningful(this.me);
        },

        removeListeners: function() {
            //TODO: Remove other listeners
            SHOTGUN.remove(kadi.Events.PICK_CARD);
            SHOTGUN.remove(kadi.Events.END_TURN);
            SHOTGUN.remove(kadi.Events.PLAY_CARDS);
            SHOTGUN.remove(kadi.Events.BLOCK);
            SHOTGUN.remove(kadi.Events.INCREMENT_CARDLESS_COUNTER);
            SHOTGUN.remove(kadi.Events.DECREMENT_CARDLESS_COUNTER);
        },

        initializeListeners: function() {
            var self = this;
            SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ this.order.current().name + " to start. " ]);

            SHOTGUN.listen(kadi.Events.PICK_CARD, function(player, num) {
                self.giveCard(player,num);
                if (player.onKADI) {
                    //need to check if we are still on kadi...
                    if (!player.canDeclareKADI()) {
                        player.kadi(false);
                    }
                }
            });

            SHOTGUN.listen(kadi.Events.END_TURN, function(player, action, playedCards, test) {
                var paused = self.order.isPaused;
                if (!paused) {
                    self.progressPlay(player, action, playedCards, test);
                }
                else {
                    self.order.executeHandler();
                    SHOTGUN.fire(kadi.Events.REPLENISHED_CARDS, [player, action, playedCards]);
                }
            });

            SHOTGUN.listen(kadi.Events.REPLENISHED_CARDS, function(player, action, playedCards) {
                self.pickingDeck.replenished = false;
                self.order.unPause();
                SHOTGUN.fire(kadi.Events.END_TURN, [player, action, playedCards]);
            });

            SHOTGUN.listen(kadi.Events.PLAY_CARDS, function(player, cards, onKADI, test) {
                self.attemptPlay(player,cards, false, onKADI, test);
            });

            SHOTGUN.listen(kadi.Events.BLOCK, function(player, blockCards, pickingCards, add, test) {
                if (add)
                    self.attemptBlock(player,blockCards,pickingCards, test);
                else
                    self.attemptPlay(player, blockCards, true, false, test);
            });

            SHOTGUN.listen(kadi.Events.REPLENISH_PICKING_CARDS, function() {

                var pauseHandler = new kadi.Handler(function() {
                    var peek = self.order.peek();
                    SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ "Shuffling cards... " + peek.name + " will be next to play" ]);
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

            SHOTGUN.listen(kadi.Events.ACCEPT_PICKING, function(player, pickingCards) {
                self.order.next();
                var next = self.order.current();
                var num = kadi.RuleEngine.calculatePicking(pickingCards, self.pickTopOnly());

                SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ player.name + " to pick " + num ]);
                SHOTGUN.fire(kadi.Events.PICK_CARD, [player,num]);
                _.delay(function() {
                    SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ self.order.turn() ]);
                    SHOTGUN.fire(kadi.Events.RECEIVE_TURN,[ new me.GameContext(self.tableDeck.topCard(),null,player)],next.id);
                },1000);
            });

            SHOTGUN.listen(kadi.Events.FINISH, function(player, action, playedCards, mode) {
                if(player.live) {
                    player.numberOfTimesWon++;
                    $.post('/record_win', { fb_id: player.id }, function(data) {});
                }

                if (self.hasLivePlayer()) {
                    $.post('/stats', { fb_id: self.me.id, start_time: self.startTime, end_time: new Date(),
                        elimination: mode == kadi.GameOptions.MODE_ELIMINATION,
                        one_card: self.kadiMode == kadi.GameOptions.ONE_CARD_KADI,
                        pick_top_card: self.pickTopOnly() }, function(data) {});
                }

                self.gameOver = true;
                if (mode == kadi.GameOptions.MODE_FIRST_TO_WIN) {
                    self.order.end();
                } else if (mode == kadi.GameOptions.MODE_ELIMINATION) {
                    self.order.end();
                    SHOTGUN.fire(kadi.Events.ELIMINATION_GAME_OVER, [self.players, player]);
                }
            });

            SHOTGUN.listen(kadi.Events.SUITE_REQUESTED, function(player, suite) {
                self.requestedSuite = suite;
                self.progressPlay(player,kadi.RuleEngine.ACTION_NONE,[]);
            });

            SHOTGUN.listen(kadi.Events.ELIMINATE_PLAYER, function(player, winner) {
                player.reset();
                player.hide();
                self.players = _.reject(self.players, function(p) { return p.eq(player); });
                SHOTGUN.fire(kadi.Events.RESTART_GAME, [winner]);
            });

            SHOTGUN.listen(kadi.Events.REINIT_GAME, function(winner) {
                self.players = self.original;
                SHOTGUN.fire(kadi.Events.RESTART_GAME, [winner]);
            });

            SHOTGUN.listen(kadi.Events.RESTART_GAME, function(winner) {
                self.startTime = new Date();
                $.post('/record_times_played', { fb_id: self.me.id });
                _.each(self.players, function(p) {
                    p.reset();
                });

                self.tableDeck.reset();
                self.noticeBoard.reset();

                var starterIdx = kadi.coinToss(self.players);
                if (kadi.isSomethingMeaningful(winner)) {
                    _.find(self.players, function(p, idx) {
                        var eq = p.eq(winner);
                        if (eq) starterIdx = idx;
                        return eq;
                    });
                }

                self.order = new me.PlayingOrder(self.players, starterIdx);
                self.dealCards();
                self.cardless = 0;

                SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ self.order.current().name + " to start. " ]);
            });

            SHOTGUN.listen(kadi.Events.RETURNED_CARDS, function(cards) {
                _.each(cards, function(c) {
                    c.hide();
                    self.pickingDeck.returnCard(c);
                });
            });

            SHOTGUN.listen(kadi.Events.INCREMENT_CARDLESS_COUNTER, function() {
//                console.log("Cardless player :-) Added");
                self.cardless++;
            });

            SHOTGUN.listen(kadi.Events.DECREMENT_CARDLESS_COUNTER, function() {
//                console.log("Cardless player :-( Removed");
                self.cardless--;
            });

            SHOTGUN.listen(kadi.Events.INCREMENT_SKIP, function(player, card) {
                self.turnsToSkip++;
                card.active = false;
                player.removeCard(card, true);
                self.tableDeck.addCard(card, !player.live);
            });
        },

        startGame: function(starterIndex, playerCards, topCard) {
            var self = this;
            this.startTime = new Date();

            if (this.hasLivePlayer()) {
                self.me.numberOfTimesPlayed++;
                $.post('/record_times_played', { fb_id: self.me.id }, function(data) { });
            }

            var starterIdx = starterIndex;
            //starterIdx = this.players.length - 1;
            if (!kadi.isSomethingMeaningful(starterIdx)) {
                starterIdx = kadi.coinToss(this.players);
            }

            _.each(this.players, function(p) {
                p.initHandlers();
                p.options = self.options;
            });

            this.order = new me.PlayingOrder(this.players, starterIdx);
            if (kadi.isSomethingMeaningful(playerCards) && kadi.isSomethingMeaningful(topCard))
                this.dealSpecificCards(playerCards, topCard);
            else
                this.dealCards();

            this.initializeListeners();
        },

        progressPlay: function(player, action, playedCards, test) {
            var self = this;

            if(this.order.isPaused)
                return;

            var delay = test? 0 : 1000;
            _.delay(function() {
//                console.log("Action : ", action);
                if (action == kadi.RuleEngine.ACTION_NONE) {
                    self.order.next();
                    var next = self.order.current();
                    SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ self.order.turn() ]);
                    SHOTGUN.fire(kadi.Events.RECEIVE_TURN,[ new me.GameContext(self.tableDeck.topCard(), self.requestedSuite, player)],next.id);
                } else if (action == kadi.RuleEngine.ACTION_REVERSE) {
                    var turnsToReverse = kadi.RuleEngine.calculateTurnsReverse(playedCards);
                    _.each(_.range(turnsToReverse), function(idx) {
                        self.order.reverse();
                    });
                    var next = self.order.current();
                    SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ self.order.turn() ]);
                    SHOTGUN.fire(kadi.Events.RECEIVE_TURN,[ new me.GameContext(self.tableDeck.topCard(),null, player)],next.id);
                } else if (action == kadi.RuleEngine.ACTION_SKIP) {
                    var next = self.order.peek();
                    var canJump = next.canJump();
                    self.turnsToSkip = kadi.RuleEngine.calculateTurnsSkipped(playedCards);

                    if (!canJump) {
                        _.each(_.range(self.turnsToSkip), function(idx) {
                            self.order.next();
                        });
                        self.order.next();
                        var next = self.order.current();
                        self.turnsToSkip = 0;
                        SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ self.order.turn() ]);
                        SHOTGUN.fire(kadi.Events.RECEIVE_TURN,[ new me.GameContext(self.tableDeck.topCard(), null, player)],next.id);
                    }
                    else {
                        if (next.live)
                            SHOTGUN.fire(kadi.Events.BLOCK_SKIP, [], next.id);
                        else
                            next.blockJump();

                        _.delay(function() {
                            if (next.live) {
                                SHOTGUN.fire(kadi.Events.RESET_PLAYER_CARDS, [], next.id);
                            }
                            _.each(_.range(self.turnsToSkip), function(idx) {
                                self.order.next();
                            });
                            self.order.next();
                            next = self.order.current();
                            self.turnsToSkip = 0;
                            SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ self.order.turn() ]);
                            SHOTGUN.fire(kadi.Events.RECEIVE_TURN,[new me.GameContext(self.tableDeck.topCard(), null)],next.id);

                        }, 1500);
                    }
                    
                } else if (action == kadi.RuleEngine.ACTION_PICK_OR_BLOCK) {
                    self.order.next();
                    var nextPlayer = self.order.current();
                    var canBlock = nextPlayer.canBlock();
                    var num = kadi.RuleEngine.calculatePicking(playedCards, self.pickTopOnly());

                    if (!canBlock) {
                        self.order.next();
                        var next = self.order.current();

                        SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ nextPlayer.name + " to pick " + num ]);
                        SHOTGUN.fire(kadi.Events.PICK_CARD, [nextPlayer,num]);
                        _.delay(function() {
                            SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ self.order.turn() ]);
                            SHOTGUN.fire(kadi.Events.RECEIVE_TURN,[new me.GameContext(self.tableDeck.topCard(),null, player)],next.id);
                        },1000);
                    }
                    else {
                        if (nextPlayer.isBot()) {
                            nextPlayer.block(playedCards, test);
                        }
                        else {
                            SHOTGUN.fire(kadi.Events.PLAYER_NOTIFICATION_UI, [nextPlayer, action, playedCards, num]);
                        }
                    }
                } else if (action == kadi.RuleEngine.ACTION_PICK_SUITE) {
                    if (player.isBot()) {
                        var suite = kadi.Strategy.askFor(player.cards());
                        var suiteName = kadi.Suite.getSuiteName(suite);

                        self.requestedSuite = suite;
                        if(!test) {
                            SHOTGUN.fire(kadi.Events.DISPLAY_REQUESTED_SUITE, [suite]);
                            SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ player.name + " has requested for " + suiteName ]);
                        }
                        self.progressPlay(player,kadi.RuleEngine.ACTION_NONE,[]);
                    } else {
                        if(!test) {
                            SHOTGUN.fire(kadi.Events.PLAYER_NOTIFICATION_UI, [player, action]);
                        }
                    }
                }
                else {
                    SHOTGUN.fire(kadi.Events.PICK_CARD, [player,1]);

                    self.order.next();
                    var next = self.order.current();

                    SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ self.order.turn() ]);
                    SHOTGUN.fire(kadi.Events.RECEIVE_TURN,[new me.GameContext(self.tableDeck.topCard(),null, player)],next.id);
                }
            }, delay);
        },

        attemptBlock: function(player,blockCards,pickingCards, test) {
            _.each(blockCards, function(card) {
                SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ player.name + " played " + card.toS()]);
                card.deSelect();
                card.active = false;
                player.removeCard(card, true);
                this.tableDeck.addCard(card, !player.live);
                player.clearSelections();
                //We already know the action
                var newPickingCards = pickingCards.concat(blockCards);
                player.endTurn(kadi.RuleEngine.ACTION_PICK_OR_BLOCK, newPickingCards, test);
            }, this);
        },

        attemptPlay : function(player, cards, isBlock, wasOnKADI, test) {
            var self = this;
            var meetsRequestedSuite = true;
            var clearRequested = false;
            if (kadi.isSomethingMeaningful(this.requestedSuite)) {
                clearRequested = true;
                meetsRequestedSuite = kadi.RuleEngine.canFollowRequestedSuite(cards,this.requestedSuite);
            }

            var canPlay = kadi.RuleEngine.isValidMove(cards, this.tableDeck.topCard());
            if (canPlay && meetsRequestedSuite) {
                if (clearRequested) {
                    this.requestedSuite = null;
                    SHOTGUN.fire(kadi.Events.HIDE_REQUESTED_SUITE, []);
                }
                _.each(cards, function(card) {
                    SHOTGUN.fire(kadi.Events.MSG_RECEIVED, [ player.displayName(true) + " played " + card.toS()]);
                    card.deSelect();
                    card.active = false;
                    player.removeCard(card, true);
                    this.tableDeck.addCard(card, !player.live);
                }, this);
                player.clearSelections();
                var action = kadi.RuleEngine.actionRequired(cards);
                var ignoreA = kadi.getVal(isBlock);
                if (ignoreA && (kadi.countNumberOfCardsOfRank(cards, "A") <= 1)) {
                    action = kadi.RuleEngine.ACTION_NONE;
                }
                if (ignoreA && (kadi.countNumberOfCardsOfRank(cards, "A") > 1)) {
                    action = kadi.RuleEngine.ACTION_PICK_SUITE;
                }
                if (!wasOnKADI)
                    player.endTurn(action,cards, test);
                else {
                    if(this.cardlessPlayerExists() && this.cardless > 1) {
                        player.endTurn(action,cards, test);
                    }
                    else {
                        console.log("%s has finished the game with hand %s, cardless: %s", player.name, kadi.handToS(cards), self.cardless);
                        _.delay(function() {
                            SHOTGUN.fire(kadi.Events.FINISH, [player, action, cards, self.options.gameEndMode, self.me]);
                        }, 2000);
                    }
                }
            } else {
                SHOTGUN.fire(kadi.Events.REJECT_MOVES, [cards], player.id);
            }
        },

        giveCard: function(to,qty) {
            _.each(_.range(qty),function(){
                var card = this.pickingDeck.deal();
                if (kadi.isSomethingMeaningful(card))
                    to.addCard(card, true);
            },this);
        },

        singleCardKadi: function() {
            return this.options.mustFinishWithOnlyOneCard();
        },

        pickTopOnly: function() {
            return this.options.canPickOnlyTheTopCard();
        },

        eliminationMode: function() {
            return this.options.isEliminationMode();
        },

        dealSpecificCards: function(playerCards, topCard) {
            _.each(playerCards, function(cards, idx) {
                var player = this.players[idx];
                _.each(cards, function(card) {
                    var cardUi = this.pickingDeck.dealCard(card);
                    player.addCard(cardUi);
                }, this);
            }, this);
            
            if (kadi.isSomethingMeaningful(topCard)) {
                var cardUi = this.pickingDeck.dealCard(topCard);
                this.tableDeck.addCard(cardUi, true);
            }
            else {
                var card = this.pickingDeck.cut();
                this.tableDeck.addCard(card, true);                
            }

            SHOTGUN.fire(kadi.Events.CARDS_DEALT,[]);
            var starter = this.order.current();
            SHOTGUN.fire(kadi.Events.RECEIVE_TURN,[new me.GameContext(this.tableDeck.topCard(), null, null)],starter.id);
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

            SHOTGUN.fire(kadi.Events.CARDS_DEALT,[]);
            var starter = this.order.current();
            SHOTGUN.fire(kadi.Events.RECEIVE_TURN,[new me.GameContext(this.tableDeck.topCard())],starter.id);
        },
        
        cardlessPlayerExists: function() {
            if(this.cardless > 0) {
                return true;
            }
            else {
                return false;
            }
        }
    });

    return me;
})(window.kadi || {}, jQuery);