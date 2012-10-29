window.kadi = (function(me, $, undefined){

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

    me.PickingDeck = me.Deck.extend({
        statics: {
            REPLENISH_THRESHOLD: 10
        },
        construct: function() {
            this.cards = [];
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
            do
            {
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
