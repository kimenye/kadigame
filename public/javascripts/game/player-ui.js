window.kadi.game = (function(me, $, undefined){
    me.Player = JS.Class({
        statics : {
            PUSHER_KEY: "3b40830094bf454823f2"
        },
        construct : function(id, name,live,debug) {
            this.id = id;
            this.name = name;
            this.live = live;
            this.debug = debug;
            this.onKADI = false;
            this.inGame = false;
        },

        initRealtime: function() {
            if (this.live && !this.debug) {
                var self = this;
                Pusher.log = function(message) {
//                    if (window.console && window.console.log) window.console.log(message);
                };
                Pusher.channel_auth_endpoint = "/pusher/presence/auth";
                this.pusher = new Pusher(me.Player.PUSHER_KEY, { encrypted: true, auth: { params: { userid: this.id, name: this.name } } });
                this.pusher.connection.bind('connected', function() {
                    self.socketId = self.pusher.connection.socket_id;
                });

                this.presence = this.pusher.subscribe("presence-gameroom");

                this.presence.bind('pusher:subscription_error', function(msg) {
                    console.log("Subscription error", msg);
                });

                this.presence.bind('pusher:subscription_succeeded', function(members) {
                    var mem = [];
                    members.each(function (member) {
                       mem.push(member);
                    });
                    SHOTGUN.fire(kadi.game.Events.MEMBERSHIP_CHANGED, [self.presence.members.count,mem,true]);
                    self.connected = true;
                });

                this.presence.bind('pusher:member_added', function(member) {
                    SHOTGUN.fire(kadi.game.Events.MEMBERSHIP_CHANGED, [self.presence.members.count, [member],true]);
                });

                this.presence.bind('pusher:member_removed', function(member) {
                    SHOTGUN.fire(kadi.game.Events.MEMBERSHIP_CHANGED, [self.presence.members.count, [member],false]);
                });

                this.presence.bind('client-game-invite', function(invite) {
                    self.handleInvite(invite);
                });

                this.presence.bind('client-game-invite-accepted', function(invite) {
                    self.handleAcceptedInvite(invite);
                });

                this.presence.bind('client-game-broadcast', function(msg) {
                    self.handleBroadcast(msg);
                });

                this.presence.bind('client-game-deal', function(deal) {
                    self.handleDeal(deal);
                });

                this.presence.bind('client-game-sync-turn', function(turn) {
                    self.handleTurnSync(turn);
                });

                this.presence.bind('client-game-event-broadcast', function(event) {
                    self.handleEventBroadcast(event);
                });

                this.presence.bind('client-game-sync-deck', function(msg) {
                    self.handleSyncedDeck(msg);
                });
            }
        },

        eq: function(other) {
            return this.id == other.id && this.name == other.name;
        },

        toS: function() {
            return this.id + " - " + this.name;
        },

        isBot: function() {
            return !this.live;
        },

        deal: function(order) {
            this._simpleSend(this.presence, 'client-game-deal', { to: "all", order: order });
        },

        broadCastEvent: function(event, data) {
//            this._simpleSend(this.presence, 'client-game-event-broadcast', { to: "all", event: event, data: data});
        },

        broadcastMessage: function(msg) {
            this._simpleSend(this.presence, 'client-game-broadcast', {from: this.id, msg: msg });
        },

        syncTurn: function(player) {
            this._simpleSend(this.presence, 'client-game-sync-turn', {turn: player.id });
        },

        syncDeck: function(deck) {
            this._simpleSend(this.presence, 'client-game-sync-deck', { from: this.id, deck: deck });
        },

        sendInvites: function() {
            this._simpleSend(this.presence,'client-game-invite', { from: this.id, at: new Date() });
        },

        acceptInvite: function(to) {
            this._simpleSend(this.presence,'client-game-invite-accepted', { from: this.id, at: new Date(), to: to });
        },

        handleDeal: function(deal) {
            SHOTGUN.fire(kadi.game.Events.DEAL, [deal.order]);
        },

        handleTurnSync: function(turn) {
            SHOTGUN.fire(kadi.game.Events.GIVE_TURN, [turn.turn]);
        },

        handleBroadcast: function(msg) {
            if (kadi.msgIsForMe(msg)) {
                SHOTGUN.fire(kadi.game.Events.MSG_RECEIVED,[msg.msg]);
            }
        },

        handleEventBroadcast: function(event) {

        },

        handleSyncedDeck: function (msg) {
            if (kadi.msgIsForMe(msg)) {
                SHOTGUN.fire(kadi.game.Events.SYNC_PICKING_DECK, [msg.deck]);
            }
        },

        handleAcceptedInvite: function(invite) {
            if (kadi.msgIsForMe(invite)) {
                SHOTGUN.fire(kadi.game.Events.INVITE_ACCEPTED, [invite.from, invite.at]);
            }
        },

        handleInvite: function(invite) {
            if (kadi.msgIsForMe(invite)) {
                SHOTGUN.fire(kadi.game.Events.INVITE_RECEIVED, [invite.from, invite.at]);
            }
        },

        //Pusher comms
        _simpleSend: function(channel, event, message) {
            channel.trigger(event, message);
        }
    });


    //TODO: Move realtime communications methods to this class...
    me.Multiplayer = me.Player.extend({

    });

    me.PlayerLocation = kadi.ui.Box.extend({
        statics: {
            T_B: "B",
            T_C: "C",
            T_D: "D"
        },
        construct: function(type) {
            this.type = type;
            this.parent.construct.apply(this, ['game', 'position_' + type, 'position ' + type]);
            this.display();
        }
    });

    me.GamePlayerUI = me.Player.extend({
        statics: {
            BOT_DELAY: 2000
        },
        construct : function(player, deck) {
            this.parent.construct.apply(this, [player.id,player.name,player.live,player.debug]);
            this.deck = deck;
            this.topCard = null;
            this.requestedSuite = null;
            this.blockMode = false;
            this.cardsToPick = [];
            this.selections = [];
            if (player.live) {
                this.notification = new kadi.game.PlayerNotification();
            }
            this.avatarUrl = kadi.fbProfileImage(this.id);
        },
        display: function(parent) {
            this.div = kadi.createDiv('player ' + this.getLocation() + "", "p" + this.id);

            if (kadi.isSomethingMeaningful(parent))
                this.parent = document.getElementById(parent);
            else
                if (this.live)
                    this.parent = document.getElementById(kadi.game.SinglePlayerGame.CONTAINER_ID);
                else
                    this.parent = document.getElementById(kadi.game.SinglePlayerGame.ID);

            this.avatar = document.createElement("IMG");
            this.avatar.className = "img-polaroid img-rounded avatar";

//            this.avatar.src = "/images/avatars/plain.gif";
            this.avatar.src = this.avatarUrl;
            this.div.appendChild(this.avatar);

            if (this.live) {
                this.buttonDiv = kadi.createDiv('btn-group button_holder action_buttons');
                this.btnMove = kadi.createButton('btn btn-move disabled btn-success', "Move");
                this.btnKadi = kadi.createButton('btn btn-kadi disabled btn-danger', "KADI");

                this.buttonDiv.appendChild(this.btnMove);
                this.buttonDiv.appendChild(this.btnKadi);

                this.div.appendChild(this.buttonDiv);
            }

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

        reset: function() {
            this.kadi(false);
            this.returnCards();
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
                    SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, move, this.onKADI]);
                }

            } else {
                var canFinish = this.onKADI && kadi.game.RuleEngine.canFinish(cards,card,null);
                if (canFinish) {
                    var moves = kadi.game.RuleEngine.movesThatCanFollowTopCardOrSuite(cards,card,null);
                    var move = _.first(moves);
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
                            SHOTGUN.fire(kadi.game.Events.PLAY_CARDS, [this, move.cards, this.onKADI]);
                        } else {
                            var move = _.first(groups);
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
            return this.cards().length > 0 && kadi.game.RuleEngine.canDeclareKADI(this.cards());
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
                $('.btn-kadi').attr('disabled', true);

                $('.btn-move').attr('disabled', false);
                $('.btn-move').removeClass('disabled');
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
                $('.btn-move').attr("disabled", !status);
                if (status)
                    $('.btn-move').removeClass('disabled');
            }
        }
    });

    return me;
})(window.kadi.game || {}, jQuery);
