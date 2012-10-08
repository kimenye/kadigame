window.kadi.game = (function(me, $, undefined){

    me.Move = JS.Class({
        construct: function(cards) {
            this.cards = cards;
        },

        first: function() {
            return _.first(this.cards);
        }
    });

    me.Strategy = JS.Class({
        statics: {
            askFor: function(hand) {
                if (hand.length > 0) {
                    var groups = _.groupBy(hand, function(c) { return c.suite });
                    var sorted = _.sortBy(groups, function(s) { return s.length });
                    var mostFrequent = _.last(sorted);
                    var aCard = _.first(mostFrequent);
                    var suite = aCard.suite;
                    if (aCard.isJoker())
                        suite = kadi.game.Suite.ANY;
                    return suite;
                } else {
                    return "";
                }

            },
            bestMoveForRequestedSuite: function(hand, suite) {
                var cardsInHandThatCanMatchTheSuite = me.RuleEngine.cardsInHandMatchingSuite(hand,suite);
                var groups = [];
                _.each(cardsInHandThatCanMatchTheSuite, function(c) {
                    var gp = [c];
                    _.each(hand, function(card) {
                        if (!c.eq(card)) {
                            var canJoin = me.RuleEngine.canJoinGroup(gp, card);
                            if (canJoin)
                                gp.push(card);
                        }
                    });
                    groups.push(gp);
                });

                groups = _.sortBy(groups, function(gp) {
                    return gp.length;
                });

                var lst = _.last(groups);
                return lst;
            }
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
            ACTION_PICK_SUITE: "Pick-Suite",
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
                else if(lastCard.isAce())
                    return me.RuleEngine.ACTION_PICK_SUITE;
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

            isValidBlockingMove : function(move) {
                var handHasAce = kadi.containsCardOfRank(move, kadi.game.Card.ACE);
                var handHasPickingCard = kadi.containsPickingCard(move);

                return (!handHasAce && handHasPickingCard) || (handHasAce && !handHasPickingCard);
            },

            canFollow: function(card, other) {
                var isSameSuite = card.suite == other.suite;
                var isSameRank = card.rank == other.rank;

                var can_follow = (isSameRank || isSameSuite || other.isAce() || card.isAce() || card.isJoker() || other.isJoker());
                return can_follow;
            },

            cardsInHandMatchingSuite: function(hand, suite) {
                return _.reject(hand, function(c) {
                    return !kadi.game.RuleEngine.canFollowRequestedSuite([c], suite);
                });
            },

            canMeetMatchingSuite: function(hand, suite) {
                return me.RuleEngine.cardsInHandMatchingSuite(hand, suite).length > 0;
            },

            cardCanFollowRequestedSuite: function(card, suite) {
                if (card.isAce() || card.isJoker() || suite == kadi.game.Suite.ANY || card.suite == suite)
                    return true;
                else
                    return false;
            },

            canFollowRequestedSuite: function(hand, suite) {
                if (hand.length == 0)
                    return false;
                var firstCard = _.first(hand);
                return kadi.game.RuleEngine.cardCanFollowRequestedSuite(firstCard,suite);
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
            },

            canFinish: function(hand,topCard, suite) {
                var validMoves = me.RuleEngine.movesThatCanFollowTopCardOrSuite(hand, topCard, suite);
                return validMoves.length > 0;
            },

            movesThatCanFollowTopCardOrSuite: function(hand, topCard, suite) {
                var moves = kadi.permute(hand);
                var matchingMoves = _.reject(moves, function(move) {
                    var moveFirstCard = _.first(move);
                    if (kadi.isSomethingMeaningful(topCard))
                        return !me.RuleEngine.canFollow(moveFirstCard, topCard);
                    else if (kadi.isSomethingMeaningful(suite))
                        return !me.RuleEngine.cardCanFollowRequestedSuite(moveFirstCard, suite);
                });
                return _.reject(matchingMoves, function(m) {
                    return !me.RuleEngine.evaluateGroup(m);
                });
            },

            canDeclareKADI: function(hand) {
                var handHasPickingCard = kadi.containsPickingCard(hand);
                var hasK = kadi.containsCardOfRank(hand,kadi.game.Card.KING);
                var hasJ = kadi.containsCardOfRank(hand,kadi.game.Card.JACK);
                var singleCard = hand.length < 2;
                var hasAce = kadi.containsCardOfRank(hand,kadi.game.Card.ACE);

                if(!handHasPickingCard && !hasK && !hasJ && !hasAce) {
                    if (singleCard)
                        return true;
                    else {
                        var moves = kadi.permute(hand);
                        var validMove = _.detect(moves, function(move) {
                            return me.RuleEngine.evaluateGroup(move);
                        });
                        return kadi.isSomethingMeaningful(validMove);
                    }
                }
                else
                    return false;
            }
        }
    });

    return me;
}) (window.kadi.game || {}, jQuery);
