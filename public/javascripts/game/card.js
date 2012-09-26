window.kadi.game = (function(me, $, undefined){
    me.Suite = JS.Class({
        statics : {
            CLUBS: "C",
            HEARTS: "H",
            DIAMONDS: "D",
            SPADES: "S",
            JOKERS: "-",
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
                }
                return name;
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
                return rankName + " of " + suiteName;
            }
        }
    });

    me.CardUI = me.Card.extend({
        statics: {
            WIDTH: 100,
            MARGIN: 1
        },
        construct : function(rank,suite,revealed) {
            this.parent.construct.apply(this, [rank, suite]);
            this.revealed = revealed;
            this.disableClick = false;
            this.buildNode();
            this.playable = this.revealed;
            this.selected = false;
        },

        buildNode: function() {
            var self = this;
            this.div = document.createElement("div");

            $(this.div).css('z-index','5000');
            $(this.div).click(function() {
                self.handleClick();
            });

            $(this.div).dblclick(function() {
//                self.handle
//                console.log("Double click");
            });

            $(this.div).hover(function() {
               if (self.playable) {
                   $(self.div).animate({
                       top: Math.max(kadi.game.PlayerDeck.Y_A - 20, $(self.div).position().top - 20)
                   },0).css( 'cursor', 'pointer' );
               }
            }, function() {
                if (self.playable) {
                    $(self.div).animate({
                        top: $(self.div).position().top + 20
                    },0);
                }
            });

            this.div.id = this.id();
            this.div.className = "card";
            this.div.appendChild(this.buildFront());
            this.div.appendChild(this.buildBack());
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
                $(this.div).toggleClass('flipped');
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
            console.log("Clicked : ", this.toS());
            this.select();
        },

        select: function() {
//            var elem = $(this.div);
            this.elem().toggleClass('selected');
        },

        elem : function() {
            return $(this.div);
        },

        flip : function() {
            var before = this.revealed;
            var elem = this.elem();
            this.revealed = !this.revealed;

            if (before) {
                elem.find('.inner').toggleClass('hidden');
            }
            elem.toggleClass('flipped');

            _.delay(function () {
                if (!before)
                    elem.find('.inner').toggleClass('hidden');
            }, 200);
        },

        display: function(parentDiv, x, y) {
            var parent = document.getElementById(parentDiv);
            this.div.style['left'] = x + "px";
            this.div.style['top'] = y + "px";
            parent.appendChild(this.div);
        },

        rotate : function(degrees) {
            var options = {
                rotate: degrees + 'deg'
            };

            if (!this.revealed) {
                options = _.extend(options, { rotateY: '-180deg' });
            }

            console.log("options : ", options);

            $(this.div).animate(options,100);
        }
    });

    return me;
}) (window.kadi.game || {}, jQuery);
