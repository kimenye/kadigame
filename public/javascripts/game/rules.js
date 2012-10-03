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
            ACTION_NONE: "None",
            ACTION_REVERSE: "Reverse",
            ACTION_SKIP: "Skip",
            ACTION_PICK: "Pick",
            ACTION_PICK_OR_BLOCK: "Pick-Or-Block",
            ACTION_INCOMPLETE : "Incomplete",
            actionRequired: function(hand) {
                var lastCard = _.last(hand);
                if (lastCard.isKing())
                    return me.RuleEngine.ACTION_REVERSE;
                else if(lastCard.isOrdinary())
                    return me.RuleEngine.ACTION_NONE;
                else if(lastCard.isPickingCard())
                    return me.RuleEngine.ACTION_PICK_OR_BLOCK;
                else if (lastCard.isQuestion())
                    return me.RuleEngine.ACTION_INCOMPLETE;
                else if (lastCard.isJack())
                    return me.RuleEngine.ACTION_SKIP;
            },
            calculatePicking: function(hand) {
                var total = 0;
                _.each(hand, function(c) {
                    if (c.is("2")) {
                        total += 2;
                    }
                    else if(c.is("3")) {
                        total += 3;
                    }
                    else if(c.isJoker()) {
                        total += 5;
                    }
                });
                return total;
            },
            canStart: function(card) {
                return !card.isFaceCard() && !card.isSpecialCard() && !card.isAce();
            },

            canBlock: function(hand) {
                var handHasAce = kadi.containsCardOfRank(hand, kadi.game.Card.ACE);
                var handHasPickingCard = kadi.containsPickingCard(hand);

                return handHasAce || handHasPickingCard;
            },

            canFollow: function(card, other) {
                var isSameSuite = card.suite == other.suite;
                var isSameRank = card.rank == other.rank;

                var can_follow = (isSameRank || isSameSuite || other.isAce() || card.isAce() || card.isJoker() || other.isJoker());
                return can_follow;
            },

            canPlay : function(hand, topCard) {
                if (hand.length > 1) {
                    var validGroup = kadi.game.RuleEngine.evaluateGroup(hand);
                    if (validGroup) {
                        var first = _.first(hand);
                        return kadi.game.RuleEngine.canFollow(first,topCard);
                    }
                    else {
                        //check for single moves
                        var possibleMoves = kadi.game.RuleEngine.possibleMoves(topCard, hand);
                        return possibleMoves.length > 0;
                    }
                }
                else if (hand.length == 1) {
                    var _card = _.first(hand);
                    return kadi.game.RuleEngine.canFollow(_card,topCard);
                }
                return false;
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
            },

            evaluateGroup: function(hand) {
                if (hand.length < 2)
                    return false;

                var _result = false;
                var _preceding = _.first(hand);

                var _idx = _.indexOf(hand, _preceding, false) + 1;
                while(_idx < hand.length) {
                    var _following = _.first(_.rest(hand, _idx));
                    _result = kadi.game.RuleEngine.canPlayTogetherWith(_preceding, _following);

                    if (!_result)
                        break;
                    _idx++;
                    _preceding = _following;
                }
                return _result;
            },

            canJoinGroup: function(group, card) {
                if (!card.isAce()) {
                    var last = _.last(group);
                    return me.RuleEngine.canPlayTogetherWith(card,last);
                }
                else {
                    return _.last(group).isAce(); //can only join groups with fellow aces
                }
            },

            bestGroup:  function(hand, topCard) {
                var _groups = me.RuleEngine.group(hand, topCard);
                var _sorted = _.sortBy(_groups, function(group) {
                    return group.length;
                });
                return _.last(_sorted);
            },

            group:function (hand, topCard) {
                var _groups = [];
                if (hand.length >= 2 && topCard != null) {
                    var moves = kadi.game.RuleEngine.possibleMoves(topCard, hand);
                    if (moves.length > 0) {
                        _.each(moves, function (move, idx) {
                            var _c = move.first();
                            var _gp = [_c];

                            _.each(hand, function (card, idx) {
                                if (!card.eq(_c)) {
                                    //can the card join the group
                                    if (me.RuleEngine.canJoinGroup(_gp, card)) {
                                        //then add it to the group
                                        _gp.push(card);
                                    }
                                }
                            });
                            if (me.RuleEngine.evaluateGroup(_gp))
                                _groups.push(_gp);
                        });
                    }
                }
                return _groups;
            }
        }
    });

    return me;
}) (window.kadi.game || {}, jQuery);
