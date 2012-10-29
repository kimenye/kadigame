window.kadi.game = (function(me, $, undefined){
    me.Player = JS.Class({
        construct : function(id, name, live, currentScore, numberOfTimesPlayed, numberOfTimesWon) {
            this.id = id;
            this.name = name;
            this.live = live;
            this.onKADI = false;
            this.selectedOpponent = true;
            this.currentScore = currentScore;
            this.numberOfTimesPlayed = numberOfTimesPlayed;
            this.numberOfTimesWon = numberOfTimesWon;
        },

        eq: function(other) {
            return this.id == other.id && this.name == other.name;
        },

        toS: function() {
            return this.id + " - " + this.name;
        },

        name: function(personal) {
            if (this.live && kadi.getVal(personal))
                return "You";
            else
                return this.name;
        },

        isBot: function() {
            return !this.live;
        }
    });

    me.SocialDashboard = JS.Class({
        construct: function(handler) {
            this.friends = [];
            this.loaded = false;
            this.handler = handler;
            var self = this;
            var url = "/social";
            $.getJSON(url, function(data) {
                if (data.success) {
                    self.friends = data.friends;
                    self.loaded = true;
                    if (kadi.isSomethingMeaningful(self.handler))
                        handler.callBack([self.friends]);
                }
            });
        }
    });

    me.GamePlayerUI = me.Player.extend({
        statics: {
            BOT_DELAY: 2500
        },
        construct : function(player, deck, prepare) {
            this.parent.construct.apply(this, [player.id,player.name,player.live, player.currentScore, player.numberOfTimesPlayed, player.numberOfTimesWon]);
            this.deck = deck;
            this.topCard = null;
            this.requestedSuite = null;
            this.blockMode = false;
            this.cardsToPick = [];
            this.kadiMode = false;
            this.selections = [];
            if (player.live) {
                this.notification = new kadi.game.PlayerNotification();
            }
            if (kadi.getVal(prepare))
                this.initDisplay();
        },
        initDisplay: function() {
            var self = this;
            this.div = kadi.createDiv('player ' + this.getLocation() + "", "p" + this.id);
            if (this.live)
                this.parent = document.getElementById(kadi.game.GameUI.CONTAINER_ID);
            else
                this.parent = document.getElementById(kadi.game.GameUI.ID);

            var url = kadi.getProfileUrl(this.id, this.live);
            this.avatar = document.createElement("IMG");
            this.avatar.className = "img-polaroid img-rounded avatar";
            this.imageLoaded = false;

            var self = this;
            this.avatar.onload = function() {
                self.imageLoaded = true;
            };

            this.avatar.src = url;
            this.div.appendChild(this.avatar);

            if (this.live) {
                this.buttonDiv = kadi.createDiv('btn-group button_holder action_buttons');
                this.btnMove = kadi.createButton('btn btn-move disabled btn-success', "Move");
                this.btnKadi = kadi.createButton('btn btn-kadi disabled btn-danger', "KADI");

                this.buttonDiv.appendChild(this.btnMove);
                this.buttonDiv.appendChild(this.btnKadi);

                this.div.appendChild(this.buttonDiv);
            }
        },
        display: function() {
            this.parent.appendChild(this.div);
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
        hide: function() {
            $(this.avatar).addClass('hidden');
        },
        show: function() {
            $(this.avatar).removeClass('hidden');
        },
        addCard: function(card,redraw) {
            if (this.cards().length < 1) {
                SHOTGUN.fire(kadi.game.Events.DECREMENT_CARDLESS_COUNTER);
            }
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
            if (this.cards().length < 1) {
                SHOTGUN.fire(kadi.game.Events.INCREMENT_CARDLESS_COUNTER);
            }
        },

        reset: function() {
            this.kadi(false);
            this.returnCards();
            this.show();
            $(this.avatar).removeClass('active');
        },

        returnCards: function() {
            SHOTGUN.fire(kadi.game.Events.RETURNED_CARDS, [this.cards()]);
            this.deck.cards = [];
        },

        canBlock: function() {
            return kadi.game.RuleEngine.canBlock(this.deck.cards);
        },
        initHandlers: function() {
            this.display();
            var self = this;
            if (this.live) {
                SHOTGUN.listen(kadi.game.Events.CARD_SELECTED, function(card) {
                    self.handleCardSelected(card);
                });

                SHOTGUN.listen(kadi.game.Events.CARD_DESELECTED, function(card) {
                    self.handleCardDeselected(card);
                });

                SHOTGUN.listen(kadi.game.Events.REJECT_MOVES, function(cards) {
                    _.each(cards, function(c) {
                        c.container().wiggle('start', {limit: 2, previous: c.rotate });
                    });
                    self.activateActions(true);
                }, this.id);

                this.btnMove = $('.btn-move').click(function(btn) {
                    if (kadi.isEnabled(this))
                        self.move();
                });
                this.btnKadi = $('.btn-kadi').click(function() {
                    if (kadi.isEnabled(this))
                        self.kadi(true);
                });
                
                SHOTGUN.listen(kadi.game.Events.BLOCK_SKIP, function() {
                
                    var clickHandler = new kadi.Handler(function(args) {
                        var cardToBlock = args[0];
                        cardToBlock.clickHandler = null;
                        cardToBlock.activeForBlock = false;
                        SHOTGUN.fire(kadi.game.Events.INCREMENT_SKIP, [self, cardToBlock]);
                    });
                    self.activateForSkipping(clickHandler);
                }, this.id);
                
                SHOTGUN.listen(kadi.game.Events.RESET_PLAYER_CARDS, function() {
                    
                    var jacks = _.filter(self.cards(), function(card) { return card.isJack() });
                    _.each(jacks, function(jack){
                        jack.activeForBlock = false;
                        jack.moveCardDown();
                    });
                    
                }, this.id);
            }

            SHOTGUN.listen(kadi.game.Events.CARDS_DEALT, function() {
                self.deck.redrawCards();
            });

            SHOTGUN.listen(kadi.game.Events.RECEIVE_TURN, function(card, requestedSuite, prev) {
                if (self.live) {
                    self.activate(true);
                    self.requestedSuite = requestedSuite;
                    self.topCard = card;
                } else {
                    _.delay(function() {
                        if (kadi.isSomethingMeaningful(prev) && prev.live) {
                            prev.disableKADI();
                        }
                        self.bot(card, requestedSuite);
                    },kadi.game.GamePlayerUI.BOT_DELAY);
                }

                $(self.avatar).addClass('active');
                if(!self.onKADI)
                    $(self.avatar).wiggle('start', { limit: 5 });
            }, this.id);
            
        },
        endTurn: function(action,playedCards) {
            SHOTGUN.fire(kadi.game.Events.END_TURN, [this, action, playedCards]);
            //check if the user can declare KADI...
            $(this.avatar).removeClass('active');
            var canDeclare = this.canDeclareKADI();

            if (this.live)
            {
                this.activate(false);
                if (canDeclare) {
                    $('.btn-kadi').attr('disabled', false);
                    $('.btn-kadi').removeClass('disabled');
                }
                else
                    this.kadi(false);
            } else {
                this.kadi(canDeclare);
            }
        },
        kadi: function(status) {
            var before = this.onKADI;
            this.onKADI = status;

            if (before && !status) {
                $(this.avatar).wiggle('stop');
                $(this.avatar).removeClass('kadi');
            }
            else if (!before && status) {
                $(this.avatar).wiggle('start');
                $(this.avatar).addClass('kadi');

                if (this.live) {
                    this.disableKADI();
                }
            }
        },
        disableKADI: function() {
            $('.btn-kadi').attr('disabled', true);
            $('.btn-kadi').addClass('disabled');
        },
        bot: function(card, requestedSuite) {
            //TODO: give the players some thinking time...
            var cards = this.cards();

            if (kadi.isSomethingMeaningful(requestedSuite)) {
                var canPlayWithRequestedSuite = kadi.game.RuleEngine.canMeetMatchingSuite(cards, requestedSuite);
                if (!canPlayWithRequestedSuite) {
                    this.pick();
                }
                else
                {
                    var canFinish = this.onKADI &&  kadi.game.RuleEngine.canFinish(cards,null,requestedSuite);
                    var move = kadi.game.Strategy.bestMoveForRequestedSuite(cards,requestedSuite);
                    if (canFinish) {
                        var moves = kadi.game.RuleEngine.movesThatCanFollowTopCardOrSuite(cards,null,requestedSuite);
                        move = _.first(moves);
                    }
                    console.log("Fired A: ", this, kadi.handToS(move), this.onKADI, new Date());
                    try
                    {
                        SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, move, this.onKADI]);
                    }
                    catch(ex) {
                        var trace = printStackTrace();
                        console.log("Trace: ", trace);
                        this.pick();
                    }
                }

            } else {
                var canFinish = this.onKADI && kadi.game.RuleEngine.canFinish(cards,card,null);
                if (canFinish) {
                    var moves = kadi.game.RuleEngine.movesThatCanFollowTopCardOrSuite(cards,card,null);
                    var move = _.first(moves);
                    console.log("Fired B: ", this, kadi.handToS(move), this.onKADI, new Date());
                    SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, move, this.onKADI]);
                }
                else {
                    var canPlay = kadi.game.RuleEngine.canPlay(cards, card);
                    if (canPlay) {
                        var groups = kadi.game.RuleEngine.group(cards,card);
                        if (groups.length == 0) {
                            //look for a possible move
                            var moves = kadi.game.RuleEngine.possibleMoves(card, cards);
                            var move = _.first(moves);
                            console.log("Fired: C", this, kadi.handToS(move.cards), this.onKADI, new Date());
                            SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, move.cards, this.onKADI]);
                        } else {
                            var move = _.first(groups);
                            console.log("Fired: D", this, kadi.handToS(move), this.onKADI, new Date());
                            SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, move, this.onKADI]);
                        }
                    }
                    else
                        this.pick();
                }
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
        canDeclareKADI: function() {
            return this.cards().length > 0 && kadi.game.RuleEngine.canDeclareKADI(this.cards(), this.kadiMode);
        },
        
        canJump: function() {
            return kadi.game.RuleEngine.canJump(this.deck.cards);
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
                    var canFinish = this.onKADI & kadi.game.RuleEngine.canFinish(this.cards(), this.topCard, this.requestedSuite);
                    SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, this.selections, canFinish]);
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
            $('.btn-move').attr("disabled", !status);
            if (status)
                $('.btn-move').removeClass('disabled');
        },
        activateForBlocking: function(pickingCards) {
            if (this.live) {
                var hasOnlyOneCardToBlock = kadi.game.RuleEngine.countBlockingCards(this.cards()) == 1;
                this.cardsToPick = pickingCards;
                this.blockMode = true;
                if (hasOnlyOneCardToBlock) {
                    var blockingCard = _.detect(this.cards(), function(c) { return c.isBlockingCard() });
                    blockingCard.select();
                    this.move();
                }
                else {
                    $('.btn-kadi').attr('disabled', true);
                    $('.btn-move').attr('disabled', false);
                    $('.btn-move').removeClass('disabled');
                    $('.btn-move').html('Block :-)');
                    this.deck.activatePickingCards();
                }
            }
        },
        
        activateForSkipping: function(clickHandler) {
            var jacks = _.filter(this.cards(), function(card) { return card.isJack() });
            _.each(jacks, function(jack){
                jack.activeForBlock = true;
                jack.clickHandler = clickHandler;
                jack.moveCardUp();
            });
            
        },
        
        activate: function(status) {
            if (this.live) {
                this.deck.activateCards(status);
                $('.btn-move').attr("disabled", !status);
                if (status)
                    $('.btn-move').removeClass('disabled');
            }
        }
    });

    return me;
})(window.kadi.game || {}, jQuery);
