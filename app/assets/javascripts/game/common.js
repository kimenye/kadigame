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
        }
    });


    return me;
})(window.kadi || {}, jQuery);
