window.kadi.game = (function(me, $, undefined){
    me.Suite = JS.Class({
        statics : {
            CLUBS: "C",
            HEARTS: "H",
            DIAMONDS: "D",
            SPADES: "S",
            JOKERS: "-",
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
            getRankName: function(rank) {
                var name = "" + rank;
                switch (rank) {
                    case kadi.game.Card.JOKER_A:
                        name = "Joker A ";
                        break;
                    case kadi.game.Card.JOKER_B:
                        name = "Joker B ";
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

            this.translate = function(id) {
                var suiteName = kadi.game.Suite.getSuiteName(this.suite);
                var rankName = kadi.game.Card.getRankName(this.rank);
                return rankName + " of " + suiteName;
            }
        }
    });

    me.CardUI = me.Card.extend({
        construct : function(rank,suite,revealed) {
            this.parent.construct.apply(this, [rank, suite]);
            this.revealed = revealed;
            this.buildNode();
        },

        buildNode: function() {

            var self = this;
            this.div = document.createElement("div");

            $(this.div).click(function() {
                self.handleClick();
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
            div.className = "front face";

            div.appendChild(this.buildRankText());
            div.appendChild(this.buildSymbol());
            div.appendChild(this.buildSymbol("large"));

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
//            return kadi.createSpan(symbol, "suite " + kadi.game.Suite.getColorClass(this.suite, this.rank) + " " + size,null);
        },

        buildRankText: function() {
            return kadi.createSpan(this.rank, "rank " + kadi.game.Suite.getColorClass(this.suite, this.rank),null);
        },

        handleClick: function() {
            console.log("Clicked ", this.translate(), $(this.div));
            $(this.div).css('z-index',900);
            $(this.div).toggleClass('flipped');
        },

        display: function(parentDiv, x, y) {
            var parent = document.getElementById(parentDiv);
            this.div.style['left'] = x + "px";
            this.div.style['top'] = y + "px";

//            console.log(this.div.style);

            parent.appendChild(this.div);
        }
    });

    return me;
}) (window.kadi.game || {}, jQuery);
