window.kadi.game = (function(me, $, undefined){
    me.Suite = JS.Class({
        statics : {
            CLUBS: "C",
            HEARTS: "H",
            DIAMONDS: "D",
            SPADES: "S",
            JOKERS: "-",
            ANY: "%",
            DECK_SIZE: 52,
            getColorClass: function(suite, rank) {
                var color = "black";
                switch(suite) {
                    case kadi.game.Suite.HEARTS:
                    case kadi.game.Suite.DIAMONDS:
                        color = "red";
                        break;
                    case kadi.game.Suite.JOKERS:
                        if (rank == kadi.game.Card.JOKER_A)
                            color = "red";
                        break;
                }
                return color;
            },
            getSuiteSymbol: function(suite) {
                var symbol = "\u00a0" ;
                switch (suite) {
                    case kadi.game.Suite.CLUBS:
                        symbol = "\u2663";
                        break;
                    case kadi.game.Suite.DIAMONDS:
                        symbol = "\u2666";
                        break;
                    case kadi.game.Suite.HEARTS:
                        symbol = "\u2665";
                        break;
                    case kadi.game.Suite.SPADES:
                        symbol = "\u2660";
                        break;
                }
                return symbol;
            },
            getSuiteName: function(suite) {
                var name = "Joker";
                switch (suite) {
                    case kadi.game.Suite.CLUBS:
                        name = "Clubs";
                        break;
                    case kadi.game.Suite.DIAMONDS:
                        name = "Diamonds";
                        break;
                    case kadi.game.Suite.HEARTS:
                        name = "Hearts";
                        break;
                    case kadi.game.Suite.SPADES:
                        name =  "Spades";
                        break;
                    case kadi.game.Suite.ANY:
                        name = "Anything";
                        break;
                }
                return name;
            },
            getSuiteDiv: function(suite) {
                var div = document.createElement("div");
                div.className = "suite_picker";

                var symbol = kadi.game.Suite.getSuiteSymbol(suite);
                var classes = "medium " + kadi.game.Suite.getColorClass(suite, kadi.game.Card.ACE);

                var symbolDiv = kadi.createSpan(symbol, classes, null);
                div.appendChild(symbolDiv);
                return div;
            },
            getDeckOfCards: function() {
                var suites = [kadi.game.Suite.CLUBS,kadi.game.Suite.HEARTS,
                    kadi.game.Suite.DIAMONDS,kadi.game.Suite.SPADES];

                var ranks = [kadi.game.Card.ACE,kadi.game.Card.TWO,kadi.game.Card.THREE,kadi.game.Card.FOUR,
                    kadi.game.Card.FIVE,kadi.game.Card.SIX,kadi.game.Card.SEVEN,kadi.game.Card.EIGHT,
                    kadi.game.Card.NINE,kadi.game.Card.TEN,kadi.game.Card.JACK,kadi.game.Card.QUEEN,
                    kadi.game.Card.KING];

                var cards = [];
                _.each(suites, function(suite) {
                    _.each(ranks, function(rank) {
                        cards.push(new me.CardUI(rank,suite));
                    });
                });

                cards.push(new me.CardUI(kadi.game.Card.JOKER_A,kadi.game.Suite.JOKERS));
                cards.push(new me.CardUI(kadi.game.Card.JOKER_A,kadi.game.Suite.JOKERS));

                cards = _.shuffle(cards);
                return cards;
            }
        }
    });

    me.Card = JS.Class({
        statics : {
            JOKER_A: "0",
            JOKER_B: "1",
            QUEEN: "Q",
            JACK: "J",
            KING: "K",
            ACE: "A",
            TEN: "10",
            NINE: "9",
            EIGHT: "8",
            SEVEN: "7",
            SIX: "6",
            FIVE: "5",
            FOUR: "4",
            THREE: "3",
            TWO: "2",
            ANY: "",
            getRankName: function(rank) {
                var name = "" + rank;
                switch (rank) {
                    case kadi.game.Card.JOKER_A:
                        name = "Joker A";
                        break;
                    case kadi.game.Card.JOKER_B:
                        name = "Joker B";
                        break;
                    case kadi.game.Card.QUEEN:
                        name = "Queen";
                        break;
                    case kadi.game.Card.JACK:
                        name = "Jack";
                        break;
                    case kadi.game.Card.KING:
                        name = "King";
                        break;
                    case kadi.game.Card.ACE:
                        name = "Ace ";
                        break;
                }
                return name;
            },
            getJokerRankText : function() {
                return "J" + "<br />" + "O" + "<br />" + "K" + "<br />" + "E" + "<br />" + "R";
            },
            fromId: function(id) {
                var split = id.split(";");
                return new kadi.game.Card(split[1], split[0]);
            }
        },
        construct : function(rank,suite) {
            this.suite = suite;
            this.rank = rank;
            this.isJoker = function() {
                return this.rank == kadi.game.Card.JOKER_A || this.rank == kadi.game.Card.JOKER_B;
            };
            this.isAce = function() {
                return this.rank == kadi.game.Card.ACE;
            };

            this.isQueen = function() {
                return this.rank == kadi.game.Card.QUEEN;
            };

            this.isFaceCard = function() {
                return this.isKing() || this.isQueen() || this.isJack();
            };

            this.is = function(rank) {
                return this.rank == rank;
            }

            this.isQuestion = function() {
                return this.isEight() || this.isQueen();
            }

            //TODO: Testing required
            this.pickingValue = function() {
                if (this.isPickingCard()) {
                    if (this.is("2")) {
                        return 2;
                    }
                    else if(this.is("3")) {
                        return 3;
                    }
                    else if(this.isJoker()) {
                        return 5;
                    }
                }
                return 0;
            }

            this.isPickingCard = function() {
                return this.isJoker() || this.is("2") || this.is("3");
            };

            this.isSpecialCard = function() {
                return (this.isJoker() || this.is("2") || this.is("3") || this.isEight());
            };

            this.isOrdinary = function() {
                return !this.isSpecialCard() && !this.isFaceCard() && !this.isAce();
            }

            this.isEight = function() {
                return this.rank == "8";
            };

            this.isKing = function() {
                return this.rank == kadi.game.Card.KING;
            };

            this.isJack = function() {
                return this.rank == kadi.game.Card.JACK;
            };

            this.id = function() {
                return this.suite + ";" + this.rank;
            };

            this.toS = function(id) {
                var suiteName = kadi.game.Suite.getSuiteName(this.suite);
                var rankName = kadi.game.Card.getRankName(this.rank);
                if (this.rank == kadi.game.Card.JOKER_A || this.rank == kadi.game.Card.JOKER_B)
                    return "Joker";
                else
                    return rankName + " of " + suiteName;
            }
        },

        eq: function(other) {
            return (this.suite == other.suite && this.rank == other.rank);
        }
    });

    me.CardUI = me.Card.extend({
        statics: {
            WIDTH: 100,
            LENGTH: 136,
            MARGIN: 1
        },
        construct : function(rank,suite,revealed) {
            this.parent.construct.apply(this, [rank, suite]);
            this.revealed = kadi.getVal(revealed);
            this.disableClick = false;
            this.buildNode();
            this.active = this.revealed;
            this.selected = false;
            this.x = -1;
            this.y = -1;
            this.rotate = null;
        },

        buildNode: function() {
            var self = this;
            this.card_container = document.createElement('section')
            this.card_container.className = "card_container";

            this.card_container.id = this.id();
            this.container().css('z-index','5000');
            this.container().click(function() {
                self.handleClick();
            });
            this.container().hover(function() {
                if (self.active) {
                    self.container().css( 'cursor', 'pointer' );
                    var top = Math.max(kadi.game.PlayerDeck.Y_A - 20, self.container().position().top - 20);
                    self.moveTo(null,top,null);
                }
            }, function() {
                if (self.active && !self.selected) {
                    self.container().css( 'cursor', 'default' );
                    self.reset();
                }
            });

            this.reset = function() {
                var top = kadi.game.PlayerDeck.Y_A;
                this.deSelect();
                this.moveTo(null,top,null);
            };

            this.div = document.createElement("div");
            this.div.className = "card";

            this.div.appendChild(this.buildBack());
            this.div.appendChild(this.buildFront());

            this.card_container.appendChild(this.div);
        },

        deSelect: function() {
            this.selected = false;
            this.container().removeClass('selected');
        },

        buildBack: function() {
            var div = document.createElement("div");
            div.className = "face back";
            return div;
        },

        buildFront: function() {
            var div = document.createElement("div");
            div.className = "face front";

            var divInner = document.createElement("div");
            divInner.className = "inner";

            if (!this.revealed) {
                divInner.className += " hidden";
            }

            if (!this.isJoker()) {
                divInner.appendChild(this.buildRankText());
                divInner.appendChild(this.buildSymbol());
                divInner.appendChild(this.buildSymbol("large"));
            } else {
                divInner.appendChild(this.buildJokerText());
            }

            div.appendChild(divInner);

            return div;
        },

        getSymbol: function() {
            return kadi.game.Suite.getSuiteSymbol(this.suite);
        },

        buildSymbol: function(size) {
            var symbol = this.getSymbol();
            var classes = "suite " + kadi.game.Suite.getColorClass(this.suite, this.rank);

            classes = kadi.isSomethingMeaningful(size) ? classes + " " + size : classes;
            return kadi.createSpan(symbol, classes, null);
        },

        buildJokerText: function() {
            return kadi.createSpan(kadi.game.Card.getJokerRankText(),"rank joker " + kadi.game.Suite.getColorClass(this.suite, this.rank),null);
        },

        buildRankText: function() {
            return kadi.createSpan(this.rank, "rank " + kadi.game.Suite.getColorClass(this.suite, this.rank),null);
        },

        handleClick: function() {
            if (this.active) {
                this.select();
            }
        },

        select: function() {
            var before = this.selected;
            this.selected = !this.selected;
            this.container().toggleClass('selected');
            if (before)
                SHOTGUN.fire(kadi.game.Events.CARD_DESELECTED, [this]);
            else
                SHOTGUN.fire(kadi.game.Events.CARD_SELECTED, [this]);
        },

        container : function() {
            return $(this.card_container);
        },

        elem : function() {
            return $(this.div);
        },

        flip : function() {
            this.revealed = !this.revealed;
            this.elem().find('.inner').toggleClass('hidden');
            this.elem().toggleClass('flip');
        },

        hide: function() {
            if (this.revealed) {
                this.flip();
            }
        },

        position: function() {
            return new kadi.Pos(this.x, this.y, this.rotate, this.transformOrigin);
        },

        moveTo: function(x,y,rotation, transformOrigin) {
            var options = {};
            if (kadi.isSomethingMeaningful(x)) {
                this.x = x;
                _.extend(options, {x: x + "px" });
            }
            if (kadi.isSomethingMeaningful(y)) {
                this.y = y;
                _.extend(options, {y: y + "px" });
            }
            if (kadi.isSomethingMeaningful(rotation)) {
                this.rotate = rotation;
                _.extend(options, { rotate: rotation + 'deg' });
            }
            if (kadi.isSomethingMeaningful(transformOrigin)) {
                this.transformOrigin = transformOrigin;
                _.extend(options, { transformOrigin: transformOrigin });
            }
            this.container().transition(options, 500, 'snap');
        },

        display: function(parentDiv, x, y,rotation) {
            var parent = document.getElementById(parentDiv);
            parent.appendChild(this.card_container);
            this.moveTo(x,y,rotation);
        },

        rotate : function(degrees) {
            var options = {
                rotate: degrees + 'deg'
            };

            if (!this.revealed) {
                options = _.extend(options, { rotateY: '-180deg' });
            }

            $(this.div).animate(options,100);
        }
    });

    return me;
}) (window.kadi.game || {}, jQuery);
