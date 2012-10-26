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
            LATE_KADI: "late-kadi",
            INCREMENT_CARDLESS_COUNTER: "increment-cardless-counter",
            DECREMENT_CARDLESS_COUNTER: "decrement-cardless-counter",
            ELIMINATION_GAME_OVER: "elimination-game-over",
            ELIMINATE_PLAYER: "eliminate-player",
            REINIT_GAME: "re-init-game",
            BLOCK_SKIP: "block-skip"
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


    me.GameOptions = JS.Class({
        statics: {
            MODE_FIRST_TO_WIN: "first-to-win",
            MODE_ELIMINATION: "elimination",
            ONE_CARD_KADI: "one-card-kadi",
            ANY_CARDS_KADI: "any-cards-kadi",
            PICKING_MODE_TOP_ONLY: "only-pick-the-top-card",
            PICKING_MODE_ALL : "pick-all-the-cards"
        }
    });

    me.Game = JS.Class({
        construct: function(player, opponents, mode, kadiMode, pickingMode) {
            this.me = player;
            this.mode = mode;
            this.kadiMode = kadiMode;
            this.opponents = opponents;
            this.pickingMode = pickingMode;
            this.players = this.opponents;
            this.original = this.players;
            if (kadi.isSomethingMeaningful(this.me))
                this.players.push(this.me);
            this.requestedSuite = null;
            this.pickingDeck = new kadi.game.PickingDeck();
            this.tableDeck = new kadi.game.TableDeck();
            this.noticeBoard = new kadi.game.NoticeBoard();
            this.cardless = 0;
        },

        startGame: function() {
            var self = this;
            this.startTime = new Date();
            $.post('/record_times_played', { fb_id: self.me.id }, function(data) {
                self.me.numberOfTimesPlayed++;
            });
            
            var starterIdx = kadi.coinToss(this.players);
            //starterIdx = this.players.length - 1;
            var starter = this.players[starterIdx];

            _.each(this.players, function(p) {
                p.initHandlers();
                p.kadiMode = self.kadiMode == kadi.game.GameOptions.ONE_CARD_KADI;
            });

            this.order = new me.PlayingOrder(this.players, starterIdx);
            //this.dealCards();
            //TODO: How to give specific players certain cards
            var playerOneCards = [kadi.spades("J"), kadi.diamonds("2")];
            var playerTwoCards = [kadi.diamonds("J"), kadi.clubs("J")];

            this.dealSpecificCards([playerOneCards, playerTwoCards]);

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
                var num = kadi.game.RuleEngine.calculatePicking(pickingCards, self.pickTopOnly());

                SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ player.name + " to pick " + num ]);
                SHOTGUN.fire(kadi.game.Events.PICK_CARD, [player,num]);
                _.delay(function() {
                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(),null,player,self.cardlessPlayerExists()],next.id);
                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                },1000);
            });
            SHOTGUN.listen(kadi.game.Events.FINISH, function(player, action, playedCards, mode) {
                $.post('/stats', { fb_id: self.me.id, start_time: self.startTime, end_time: new Date(),
                    elimination: mode == kadi.game.GameOptions.MODE_ELIMINATION,
                    one_card: self.kadiMode == kadi.game.GameOptions.ONE_CARD_KADI,
                    pick_top_card: self.pickTopOnly() }, function(data) {
                });

                if(player.live) {
                    player.numberOfTimesWon++;
                    $.post('/record_win', { fb_id: player.id }, function(data) {
                    });
                }
                
                if (mode == kadi.game.GameOptions.MODE_FIRST_TO_WIN) {
                    self.order.end();
                } else if (mode == kadi.game.GameOptions.MODE_ELIMINATION) {
                    self.order.end();
                    SHOTGUN.fire(kadi.game.Events.ELIMINATION_GAME_OVER, [self.players, player]);
                }
            });

            SHOTGUN.listen(kadi.game.Events.SUITE_REQUESTED, function(player, suite) {
                self.requestedSuite = suite;
                self.progressPlay(player,kadi.game.RuleEngine.ACTION_NONE,[]);
            });

            SHOTGUN.listen(kadi.game.Events.ELIMINATE_PLAYER, function(player, winner) {
                player.reset();
                player.hide();
                self.players = _.reject(self.players, function(p) { return p.eq(player); });
                SHOTGUN.fire(kadi.game.Events.RESTART_GAME, [winner]);
            });

            SHOTGUN.listen(kadi.game.Events.REINIT_GAME, function(winner) {
                self.players = self.original;
                SHOTGUN.fire(kadi.game.Events.RESTART_GAME, [winner]);
            });

            SHOTGUN.listen(kadi.game.Events.RESTART_GAME, function(winner) {
                self.startTime = new Date();
                $.post('/record_times_played', { fb_id: self.me.id }, function(data) {
                    
                });
                
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
            
            SHOTGUN.listen(kadi.game.Events.INCREMENT_CARDLESS_COUNTER, function() {
                self.cardless++;
            });
            
            SHOTGUN.listen(kadi.game.Events.DECREMENT_CARDLESS_COUNTER, function() {
                self.cardless--;
            });
            
            SHOTGUN.listen(kadi.game.Events.BLOCK_SKIP, function() {
                //$("a.confirm").click(function(e) {
                //    e.preventDefault();
                //    bootbox.confirm("Block Jump?", function(confirmed) {
                //        console.log("Jumped: "+confirmed);
                //        turnsToSkip++;
                //    });
                //});
                
                if (confirm("Block")) {
                    
                    alert("skipped");
                    turnsToSkip++;
                
               }
                
                
                //offer user block dialog/button
                //turnsToSkip++;
            }, self.me.id);

            //_.delay(function() {
            //    starter.returnCards();
            //    SHOTGUN.fire(kadi.game.Events.FINISH, [starter, kadi.game.RuleEngine.ACTION_NONE, [], self.mode]);
            //}, 0);
        },

        progressPlay: function(player, action, playedCards, test) {
            var self = this;

            if(this.order.isPaused)
                return;

            _.delay(function() {
                if (action == kadi.game.RuleEngine.ACTION_NONE) {
                    self.order.next();
                    var next = self.order.current();
                    if(!test) {
                        SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                        SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(), self.requestedSuite, player,self.cardlessPlayerExists()],next.id);
                        SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                    }
                } else if (action == kadi.game.RuleEngine.ACTION_REVERSE) {
                    var turnsToReverse = kadi.game.RuleEngine.calculateTurnsReverse(playedCards);
                    _.each(_.range(turnsToReverse), function(idx) {
                        self.order.reverse();
                    });
                    var next = self.order.current();
                    if(!test) {
                        SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                        SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(),null, player,self.cardlessPlayerExists()],next.id);
                        SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                    }
                } else if (action == kadi.game.RuleEngine.ACTION_SKIP) {//check if next player canJump
                    // place turnsToSkip outside
                    // if next canJump then fire event
                    // in the event listener increment turns to skip
                    // reset turns to skip to 0
                    var next = self.order.peek();
                    var canJump = next.canJump();
                    turnsToSkip = kadi.game.RuleEngine.calculateTurnsSkipped(playedCards);
                    
                    if (!canJump) {
                        _.each(_.range(turnsToSkip), function(idx) {
                            self.order.next();
                        });
                        self.order.next();
                        var next = self.order.current();
                        turnsToSkip = 0;
                        if(!test) {
                            SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(), null, player,self.cardlessPlayerExists()],next.id);
                            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                        }
                    }
                    else {
                        
                        if(self.order.peek().live) {
                            SHOTGUN.fire(kadi.game.Events.BLOCK_SKIP, [], player.id);
                            _.delay(function() {
                                _.each(_.range(turnsToSkip), function(idx) {
                                    self.order.next();
                                });
                                self.order.next();
                                var next = self.order.current();
                                turnsToSkip = 0;
                                if(!test) {
                                    SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(), null, player,self.cardlessPlayerExists()],next.id);
                                    SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                                }
                            }, 3000);
                        }
                        else {
                            turnsToSkip++;
                            _.each(_.range(turnsToSkip), function(idx) {
                                self.order.next();
                            });
                            self.order.next();
                            var next = self.order.current();
                            turnsToSkip = 0;
                            if(!test) {
                                SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                                SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(), null, player,self.cardlessPlayerExists()],next.id);
                                SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                            }
                        }
                    }
                    
                } else if (action == kadi.game.RuleEngine.ACTION_PICK_OR_BLOCK) {
                    self.order.next();
                    var nextPlayer = self.order.current();
                    var canBlock = nextPlayer.canBlock();
                    var num = kadi.game.RuleEngine.calculatePicking(playedCards, self.pickTopOnly());

                    if (!canBlock) {
                        self.order.next();
                        var next = self.order.current();

                        if(!test) {
                            SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ nextPlayer.name + " to pick " + num ]);
                            SHOTGUN.fire(kadi.game.Events.PICK_CARD, [nextPlayer,num]);
                            _.delay(function() {
                                SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                                SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(),null, player,self.cardlessPlayerExists()],next.id);
                                SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                            },1000);
                        }
                    }
                    else {
                        if (nextPlayer.isBot()) {
                            nextPlayer.block(playedCards);
                        }
                        else {
                            if(!test) {
                                SHOTGUN.fire(kadi.game.Events.PLAYER_NOTIFICATION_UI, [nextPlayer, action, playedCards, num]);
                            }
                        }
                    }
                } else if (action == kadi.game.RuleEngine.ACTION_PICK_SUITE) {
                    if (player.isBot()) {
                        var suite = kadi.game.Strategy.askFor(player.cards());
                        var suiteName = kadi.game.Suite.getSuiteName(suite);

                        self.requestedSuite = suite;
                        if(!test) {
                            SHOTGUN.fire(kadi.game.Events.DISPLAY_REQUESTED_SUITE, [suite]);
                            SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ player.name + " has requested for " + suiteName ]);
                        }
                        self.progressPlay(player,kadi.game.RuleEngine.ACTION_NONE,[]);
                    } else {
                        if(!test) {
                            SHOTGUN.fire(kadi.game.Events.PLAYER_NOTIFICATION_UI, [player, action]);
                        }
                    }
                }
                else {
                    if(!test) {
                        SHOTGUN.fire(kadi.game.Events.PICK_CARD, [player,1]);
                    }
                    self.order.next();
                    var next = self.order.current();
                    if(!test) {
                        SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED, [ self.order.turn() ]);
                        SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[self.tableDeck.topCard(),null, player,self.cardlessPlayerExists()],next.id);
                        SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[next],'deck');
                    }
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
            var self = this;
            var meetsRequestedSuite = true;
            var clearRequested = false;
            if (kadi.isSomethingMeaningful(this.requestedSuite)) {
                clearRequested = true;
                meetsRequestedSuite = kadi.game.RuleEngine.canFollowRequestedSuite(cards,this.requestedSuite);
            }

            var canPlay = kadi.game.RuleEngine.isValidMove(cards, this.tableDeck.topCard());
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
                if (ignoreA && (kadi.countNumberOfCardsOfRank(cards, "A") <= 1)) {
                    action = kadi.game.RuleEngine.ACTION_NONE;
                }
                if (ignoreA && (kadi.countNumberOfCardsOfRank(cards, "A") > 1)) {
                    action = kadi.game.RuleEngine.ACTION_PICK_SUITE;
                }
                if (!wasOnKADI)
                    player.endTurn(action,cards);
                else {
                    console.log("%s has finished the game with hand %s, cardless: %s", player.name, kadi.handToS(cards), self.cardless);
                    _.delay(function() {
                        SHOTGUN.fire(kadi.game.Events.FINISH, [player, action, cards, self.mode]);
                    }, 2000);
                }
            } else {
                SHOTGUN.fire(kadi.game.Events.REJECT_MOVES, [cards], player.id);
            }
        },

        giveCard: function(to,qty) {
            _.each(_.range(qty),function(){
                var card = this.pickingDeck.deal();
                if (kadi.isSomethingMeaningful(card))
                    to.addCard(card, true);
            },this);
        },

        pickTopOnly: function() {
            return this.pickingMode == kadi.game.GameOptions.PICKING_MODE_TOP_ONLY;
        },

        dealSpecificCards: function(playerCards) {
            _.each(playerCards, function(cards, idx) {
                var player = this.players[idx];

                _.each(cards, function(card) {
                    var cardUi = _.find(this.pickingDeck.deck, function(c) {
                        return c.eq(card);
                    }, this);

                    player.addCard(cardUi);

                    //remove the card from the deck
                    this.pickingDeck.deck = _.reject(this.pickingDeck.deck, function(c) {
                        return c.eq(cardUi);
                    });
                }, this);

            }, this);

            var card = this.pickingDeck.cut();
            this.tableDeck.addCard(card, true);

            SHOTGUN.fire(kadi.game.Events.CARDS_DEALT,[]);
            var starter = this.order.current();
            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[this.tableDeck.topCard(),null,null,this.cardlessPlayerExists()],starter.id);
            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[starter], 'deck');
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
            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[this.tableDeck.topCard(),null,null,this.cardlessPlayerExists()],starter.id);
            SHOTGUN.fire(kadi.game.Events.RECEIVE_TURN,[starter], 'deck');
        },
        
        cardlessPlayerExists: function() {
            if(this.cardless > 0)
                return true;
            else
                return false;
        }
    });

    return me;
})(window.kadi.game || {}, jQuery);