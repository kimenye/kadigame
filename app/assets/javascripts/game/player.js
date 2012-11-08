window.kadi = (function(me, $, undefined){
    me.Player = JS.Class({
        construct : function(id, name, live, currentScore, numberOfTimesPlayed, numberOfTimesWon, deck) {
            this.id = id;
            this.name = name;
            this.live = live;
            this.onKADI = false;
            this.selectedOpponent = true;
            this.currentScore = currentScore;
            this.numberOfTimesPlayed = numberOfTimesPlayed;
            this.numberOfTimesWon = numberOfTimesWon;
            this.selections = [];
            this.deck = deck;
            this.options = null;
            this.gameContext = null;
            this.active = false;
        },

        eq: function(other) {
            return this.id == other.id && this.name == other.name;
        },

        toS: function() {
            return this.id + " - " + this.name;
        },

        displayName: function(personal) {
            if (this.live && kadi.getVal(personal))
                return "You";
            else
                return this.name;
        },

        isBot: function() {
            return !this.live;
        },

        clearSelections: function() {
            this.selections = []; //TODO: should this really be on the player or UI?
        },

        cards: function() {
            return this.deck.cards;
        },

        canBlock: function() {
            return kadi.RuleEngine.canBlock(this.deck.cards);
        },

        kadi: function(status) {
            var before = this.onKADI;
            this.onKADI = status;
            return before;
        },

        returnCards: function() {
            SHOTGUN.fire(kadi.Events.RETURNED_CARDS, [this.cards()]);
            this.deck.cards = [];
        },

        addCard: function(card) {
            if (this.deck.isEmpty()) {
                SHOTGUN.fire(kadi.Events.DECREMENT_CARDLESS_COUNTER);
            }
            this.deck.addCard(card);
        },

        removeCard: function(card,redraw) {
            this.deck.removeCard(card);
            if (this.deck.isEmpty()) {
                SHOTGUN.fire(kadi.Events.INCREMENT_CARDLESS_COUNTER);
            }
        },

        isCardless: function() {
            return this.deck.isEmpty();
        },

        canJump: function() {
            return kadi.RuleEngine.canJump(this.deck.cards);
        },

        removeListeners: function() {
            //TODO: remove offending events
        },

        initHandlers: function() {
            var self = this;
            SHOTGUN.listen(kadi.Events.RECEIVE_TURN, function(gameContext) {
                self.handleReceiveTurn(gameContext);
            }, this.id);
        },

        handleReceiveTurn: function(gameContext) {
            this.gameContext = gameContext;
            this.active = true;
        },

        isMyTurn: function() {
            return kadi.isSomethingMeaningful(this.gameContext);
        },

        play: function(cards, test) {
            var move = [];
            _.each(cards, function(c) {
                var cardUi = _.detect(this.cards(), function(card) {
                    return card.eq(c);
                });

                if (kadi.isSomethingMeaningful(cardUi))
                    move.push(cardUi);

            }, this);
            SHOTGUN.fire(kadi.Events.PLAY_CARDS, [this, move, this.onKADI, test]);
        },

        canFinish: function() {
            var topCard = kadi.isSomethingMeaningful(this.gameContext.topCard) ? this.gameContext.topCard : null;
            var suite = kadi.isSomethingMeaningful(this.gameContext.requestedSuite) ? this.gameContext.requestedSuite : null;
            return this.onKADI && kadi.RuleEngine.canFinish(this.cards(),topCard,suite);
        },

        bot: function(test) {
            var cards = this.cards();

            if (kadi.isSomethingMeaningful(this.gameContext.requestedSuite)) {
                var canPlayWithRequestedSuite = kadi.RuleEngine.canMeetMatchingSuite(cards, this.gameContext.requestedSuite);
                if (!canPlayWithRequestedSuite) {
                    this.pick(test);
                }
                else {
                    var move = kadi.Strategy.bestMoveForRequestedSuite(cards,this.gameContext.requestedSuite);
                    if (this.canFinish()) {
                        var moves = kadi.RuleEngine.movesThatCanFollowTopCardOrSuite(cards,null,this.gameContext.requestedSuite);
                        move = _.first(moves);
                    }
                    SHOTGUN.fire(kadi.Events.PLAY_CARDS, [this, move, this.onKADI, test]);
                }
            } else {
                var canFinish = this.canFinish();
                if (canFinish) {
                    var moves = kadi.RuleEngine.movesThatCanFollowTopCardOrSuite(cards,this.gameContext.topCard,null);
                    var move = _.first(moves);
                    SHOTGUN.fire(kadi.Events.PLAY_CARDS, [this, move, this.onKADI, test]);
                }
                else {
                    var canPlay = kadi.RuleEngine.canPlay(cards, this.gameContext.topCard);
                    if (canPlay) {
                        var groups = kadi.RuleEngine.group(cards,this.gameContext.topCard);
                        if (groups.length == 0) {
                            //look for a possible move
                            var moves = kadi.RuleEngine.possibleMoves(this.gameContext.topCard, cards);
                            var move = _.first(moves);
                            SHOTGUN.fire(kadi.Events.PLAY_CARDS, [this, move.cards, this.onKADI, test]);
                        } else {
                            var move = _.first(groups);
                            SHOTGUN.fire(kadi.Events.PLAY_CARDS, [this, move, this.onKADI, test]);
                        }
                    }
                    else
                        this.pick(test);
                }
            }
        },

        block: function(pickingCards, test) {
            //the blocking strategy is to add a single picking card of the highest value
            var hasPickingCard = kadi.containsPickingCard(this.deck.cards);

            //TODO: Never block if you have a picking card and the next player is on KADI
            if (hasPickingCard) {
                var highestCard = kadi.highestPickingCard(this.deck.cards);
                SHOTGUN.fire(kadi.Events.BLOCK, [this, [highestCard], pickingCards, true, test]);
            } else {
                var ace = _.detect(this.deck.cards, function(c) { return c.rank == kadi.Card.ACE });
                SHOTGUN.fire(kadi.Events.BLOCK, [this, [ace], pickingCards, false, test]);
            }
        },

        blockJump: function() {
            _.each(_.filter(this.cards(), function(c) { return c.isJack() }), function(jack) {
                SHOTGUN.fire(kadi.Events.INCREMENT_SKIP, [this, jack]);
            }, this);
        },

        pick: function(test) {
            SHOTGUN.fire(kadi.Events.PICK_CARD, [this, 1]);
            this.endTurn(kadi.RuleEngine.ACTION_NONE, [],test);
        },

        endTurn: function(action,playedCards,test) {
            this.gameContext = null;
            SHOTGUN.fire(kadi.Events.END_TURN, [this, action, playedCards, test]);
            var canDeclare = this.canDeclareKADI();
            this.active = false;
            if (this.live) {
                if (!canDeclare)
                    this.kadi(false);
            }
            else
                this.kadi(canDeclare);
        },

        canDeclareKADI: function() {
            return this.cards().length > 0 && kadi.RuleEngine.canDeclareKADI(this.cards(), this.options.mustFinishWithOnlyOneCard());
        }
    });

    me.RealtimeSync = JS.Class({
        statics: {
            GAMEROOM_CHANNEL: "presence-gameroom",
            EVENT_CHANNEL_SUBSCRIBED : "event-channel-subscribed",
            EVENT_CHANNEL_UNSUBSCRIBED: "event-channel-unsubscribed",
            EVENT_MEMBER_ADDED : "event-member-added",
            EVENT_MEMBER_LEFT: "event-member-left",
            EVENT_CHANNEL_SUB_ERROR: "event-channel-sub-error"
        },
        construct: function(player, init, test) {
            this.player = player;
            this.connected = false;
            this.test = test;
            if (kadi.getVal(init))
                this.init();
        },

        init: function() {
            var self = this;
            var start = new Date();
            this.pusher = new Pusher("3b40830094bf454823f2", { encrypted: true, auth: { params: { userid: this.player.id, name: this.player.name } } });
            this.pusher.connection.bind('connected', function() {
                self.socketId = self.pusher.connection.socket_id;
            });

            var channel = this.presenceChannelName();

            this.gameRoomPresence  = this.pusher.subscribe(channel);
            this.gameRoomPresence.bind('pusher:subscription_error', function(msg) {
                SHOTGUN.fire(me.RealtimeSync.EVENT_CHANNEL_SUB_ERROR, [msg]);
            });

            this.gameRoomPresence.bind('pusher:subscription_succeeded', function() {
                var end = new Date();
                self.connected = true;
                SHOTGUN.fire(me.RealtimeSync.EVENT_CHANNEL_SUBSCRIBED, [channel, self.gameRoomPresence.members.count]);
            });

            this.gameRoomPresence.bind('pusher:member_added', function(member) {
                SHOTGUN.fire(me.RealtimeSync.EVENT_MEMBER_ADDED, [channel, member, self.gameRoomPresence.members.count]);
            });

            this.gameRoomPresence.bind('pusher:member_removed', function(member) {
                SHOTGUN.fire(me.RealtimeSync.EVENT_MEMBER_LEFT, [channel, member, self.gameRoomPresence.members.count]);
            });
        },

        presenceChannelName: function() {
            return me.RealtimeSync.GAMEROOM_CHANNEL + (this.test? "-test" : "");
        },

        disconnectChannel: function(channel) {
            this.pusher.unsubscribe(channel);
        },

        disconnectPresence: function() {
            this.disconnectChannel(this.presenceChannelName());
            this.connected = false;
        },

        disconnect: function() {
            this.disconnectPresence();
            this.pusher.disconnect();
        }
    });

    me.GamePlayerUI = me.Player.extend({
        statics: {
            BOT_DELAY: 2500
        },
        construct : function(player, deck, prepare) {
            this.parent.construct.apply(this, [player.id,player.name,player.live, player.currentScore, player.numberOfTimesPlayed, player.numberOfTimesWon, deck]);
            this.blockMode = false;
            this.cardsToPick = []; //TODO: remove
            this.kadiMode = false; //TODO: remove

//            var myViewModel = {
//                numOnline: ko.observable(0)
//            };
//            ko.applyBindings(myViewModel);
            if (player.live) {
                this.notification = new kadi.PlayerNotification();

//                SHOTGUN.listen(kadi.RealtimeSync.EVENT_CHANNEL_SUBSCRIBED, function(channel, memberCount) {
//                    myViewModel.numOnline(memberCount);
//                });
//
//                SHOTGUN.listen(kadi.RealtimeSync.EVENT_MEMBER_ADDED, function(channel, member, memberCount) {
//                    myViewModel.numOnline(memberCount);
//                });
//
//                SHOTGUN.listen(kadi.RealtimeSync.EVENT_MEMBER_LEFT, function(channel, member, memberCount) {
//                    myViewModel.numOnline(memberCount);
//                });

//                var sync = new kadi.RealtimeSync(player, true);
            }
            if (kadi.getVal(prepare))
                this.initDisplay();
        },

        initDisplay: function() {
            var self = this;
            this.div = kadi.createDiv('player ' + this.getLocation() + "", "p" + this.id);
            if (this.live)
                this.parentDiv = document.getElementById(kadi.GameUI.CONTAINER_ID);
            else
                this.parentDiv = document.getElementById(kadi.GameUI.ID);

            var url = kadi.getProfileUrl(this.id, this.live);
            this.avatar = document.createElement("IMG");
            this.avatar.className = "img-polaroid img-rounded avatar";
            this.imageLoaded = false;

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
            this.parentDiv.appendChild(this.div);
        },

        getLocation: function() {
            return this.deck.type;
        },

        hide: function() {
            $(this.avatar).addClass('hidden');
        },

        show: function() {
            $(this.avatar).removeClass('hidden');
        },

        addCard: function(card,redraw) {
            this.parent.addCard.apply(this, [card]);
            if (this.live)
                card.flip();
            if (redraw)
                this.deck.redrawCards();
        },

        removeCard: function(card,redraw) {
            this.parent.removeCard.apply(this, [card]);
            if (redraw)
                this.deck.redrawCards();
        },

        reset: function() {
            this.kadi(false);
            this.returnCards();
            this.show();
            $(this.avatar).removeClass('active');
        },

        initHandlers: function() {
            this.display();
            this.parent.initHandlers.apply(this, []);
            var self = this;
            if (this.live) {

                SHOTGUN.listen(kadi.Events.CARD_DOUBLE_CLICKED, function(card) {
                    self.handleCardSelected(card);
                    self.move();
                });

                SHOTGUN.listen(kadi.Events.CARD_SELECTED, function(card) {
                    self.handleCardSelected(card);
                });

                SHOTGUN.listen(kadi.Events.CARD_DESELECTED, function(card) {
                    self.handleCardDeselected(card);
                });

                SHOTGUN.listen(kadi.Events.REJECT_MOVES, function(cards) {
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
                
                SHOTGUN.listen(kadi.Events.BLOCK_SKIP, function() {
                
                    var clickHandler = new kadi.Handler(function(args) {
                        var cardToBlock = args[0];
                        cardToBlock.clickHandler = null;
                        cardToBlock.activeForBlock = false;
                        SHOTGUN.fire(kadi.Events.INCREMENT_SKIP, [self, cardToBlock]);
                    });
                    self.activateForSkipping(clickHandler);
                }, this.id);

                SHOTGUN.listen(kadi.Events.RESET_PLAYER_CARDS, function() {
                    var jacks = _.filter(self.cards(), function(card) { return card.isJack() });
                    _.each(jacks, function(jack){
                        jack.activeForBlock = false;
                        jack.moveCardDown();
                    });
                }, this.id);

                SHOTGUN.listen(kadi.Events.ACTIVE_PLAYER_PICK, function() {
                    self.pick();
                });
            }

            SHOTGUN.listen(kadi.Events.CARDS_DEALT, function() {
                self.deck.redrawCards();
            });
        },

        handleReceiveTurn: function(gameContext) {
            this.parent.handleReceiveTurn.apply(this, [gameContext]);
            if (this.live) {
                this.activate(true);
            } else {
                var self = this;
                _.delay(function() {
                    if(gameContext.previousPlayerIsLive())
                        gameContext.previousPlayer.disableKADI();
                    self.bot();
                }, kadi.GamePlayerUI.BOT_DELAY);
            }

            $(this.avatar).addClass('active');
            if(!this.onKADI)
                $(this.avatar).wiggle('start', { limit: 5 });
        },

        endTurn: function(action,playedCards) {
            this.parent.endTurn.apply(this, [action, playedCards]);
            //check if the user can declare KADI...
            $(this.avatar).removeClass('active');
            var canDeclare = this.canDeclareKADI();

            if (this.live) {
                this.activate(false);
                if (canDeclare) {
                    $('.btn-kadi').attr('disabled', false);
                    $('.btn-kadi').removeClass('disabled');
                }
            }
        },

        kadi: function(status) {
            var before = this.parent.kadi.apply(this, [status]);

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

        move: function() {
            if (this.blockMode) {
                if (kadi.RuleEngine.isValidBlockingMove(this.selections)) {
                    var ace = kadi.containsCardOfRank(this.selections, kadi.Card.ACE);

                    $('.btn-move').html('Move');
                    SHOTGUN.fire(kadi.Events.BLOCK, [this, this.selections, this.cardsToPick, !ace]);
                    this.activate(false);
                    this.blockMode = false;
                    this.cardsToPick = [];
                }
            }
            else {
                if (this.selections.length > 0) {
                    this.activateActions(false);
                    var canFinish = this.onKADI & kadi.RuleEngine.canFinish(this.cards(), this.gameContext.topCard, this.gameContext.requestedSuite);
                    SHOTGUN.fire(kadi.Events.PLAY_CARDS, [this, this.selections, canFinish, false]);
                }
            }
        },

        handleCardSelected: function(card) {
            this.selections.push(card);
        },

        handleCardDeselected: function(card) {
            this.selections = _.reject(this.selections, function(c) {
                return c.eq(card);
            },this);
        },

        activateActions : function(status) {
            $('.btn-move').attr("disabled", !status);
            if (status)
                $('.btn-move').removeClass('disabled');
        },

        activateForBlocking: function(pickingCards) {
            if (this.live) {
                var hasOnlyOneCardToBlock = kadi.RuleEngine.countBlockingCards(this.cards()) == 1;
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
                jack.wiggle();
            });
        },
        
        activate: function(status) {
            if (this.live) {
                this.deck.activateCards(status);
                $('.btn-move').attr("disabled", !status);
                if (status)
                    $('.btn-move').removeClass('disabled');
                SHOTGUN.fire(kadi.Events.ACTIVATE_PICKING_DECK, [status]);
            }
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

    return me;
})(window.kadi || {}, jQuery);
