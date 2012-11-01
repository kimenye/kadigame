window.kadi = (function(me, $, undefined){

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
            ACTIVATE_PICKING_DECK: "activate-picking-deck",
            ACTIVE_PLAYER_PICK: "active-player-pick",
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
            SHOW_OPTIONS: "show-options",
            BLOCK_SKIP: "block-skip",
            INCREMENT_SKIP: "increment-skip",
            RESET_PLAYER_CARDS: "reset-player-cards",
            CARD_DOUBLE_CLICKED: "card-double-clicked"
        }
    });

    me.Deck = JS.Class({
        construct : function() {
            this.cards = [];
        },
        isEmpty: function() {
            return !kadi.isSomethingMeaningful(this.cards) || this.cards.length == 0;
        },
        addCard: function(card) {
            this.cards.push(card);
        },
        removeCard: function(card) {
            this.cards = _.reject(this.cards, function(c) {
                return c.eq(card);
            });
        },
        hasCards: function() {
            return !this.isEmpty();
        },
        numCards: function() {
            return this.cards.length;
        }
    });

    me.TableDeck = me.Deck.extend({
        statics: {
            MIN_CARDS: 5
        },
        construct: function() {
            this.cards = [];
        },

        topCard: function() {
            return _.last(this.cards);
        },

        replenishCards: function() {
            //TODO: needs to be tested...
            if (this.numCards() >= kadi.TableDeck.MIN_CARDS) {
                var availCards = this.numCards();
                var cardsToPick = availCards - kadi.TableDeck.MIN_CARDS;
                var cardsToRecycle = _.first(this.cards,cardsToPick);
                var remaining = _.rest(this.cards,cardsToPick);
                this.cards = remaining;
                return cardsToRecycle;
            }
            return [];
        }
    });

    me.PickingDeck = me.Deck.extend({
        statics: {
            REPLENISH_THRESHOLD: 10
        },
        construct: function(cards) {
            this.cards = cards;
            this.replenished = false;
        },

        returnCard: function(card) {
            this.addCard(card);
        },

        giveCardTo: function(card, player) {
            var card = _.find(this.cards, function(c) {
                return c.eq(card);
            });

            if (kadi.isSomethingMeaningful(card)) {
                player.addCard(card,true);
            }
        },

        cut: function() {
            var canStart = false;
            var card = null;
            do {
                var card = this.cards.shift();
                canStart = kadi.RuleEngine.canStart(card);
                if (!canStart)
                    this.addCard(card);
            }
            while(!canStart)
            return card;
        },

        deal: function() {
            if (this.numCards() <= kadi.PickingDeck.REPLENISH_THRESHOLD && !this.replenished) {
                this.replenished = true;
                SHOTGUN.fire(kadi.Events.REPLENISH_PICKING_CARDS,[]);
            }
            return this.cards.pop();
        }
    });

    return me;
})(window.kadi || {}, jQuery);
