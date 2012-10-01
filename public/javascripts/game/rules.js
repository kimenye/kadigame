window.kadi.game = (function(me, $, undefined){

    me.Move = JS.Class({

        construct: function(cards) {
            this.cards = cards;
        },

        first: function() {
            return _.first(this.cards);
        }
    });


    me.RuleEngine = JS.Class({
        statics: {
            canStart: function(card) {
                return !card.isFaceCard() && !card.isSpecialCard() && !card.isAce();
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
            },

            canPlayTogetherWith: function(card, other) {
                var follow = me.RuleEngine.canFollow(card,other);
                var sameRank = card.rank == other.rank;
                var sameSuite = card.suite == other.suite;

                if (card.isQueen() || card.isEight())
                    return follow && (sameSuite || sameRank);
                else
                    return follow && sameRank;
            },

            canEndMove: function(card) {
                return !card.isQueen() && !card.isEight();
            },

            possibleMoves: function(topCard, hand) {
                var moves = [];
                _.each(hand, function(card) {
                    if(me.RuleEngine.canFollow(card, topCard)) {
                        moves.push(new kadi.game.Move([card]));
                    }
                });
                return moves;
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
        }
    });

    return me;
}) (window.kadi.game || {}, jQuery);
