window.kadi.game = (function(me, $, undefined){

    me.RuleEngine = JS.Class({
        statics: {
            canStart: function(card) {
                return !card.isFaceCard() && !card.isSpecialCard() && !card.isAce();
            }
        },

        /**
         * By default return true
         * @param selections
         * @param topCard
         * @return {Boolean}
         */
        canPlay: function(selections, topCard) {
            return true;
        },

        /**
         * Check if a card can follow another card...
         *
         * @param card
         */
        canFollow: function(card, other) {
            var isSameSuite = card.suite == other.suite;
            var isSameRank = card.rank == other.rank;

            var can_follow = (isSameRank || isSameSuite || other.isAce() || card.isAce());
            return can_follow;
        }
    });

    return me;
}) (window.kadi.game || {}, jQuery);
