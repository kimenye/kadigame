window.kadi.game = (function(me, $, undefined){
    me.Suite = JS.Class({
        statics : {
            CLUBS: "C",
            HEARTS: "H",
            DIAMONDS: "D",
            SPADES: "S",
            JOKERS: "-",
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
//            this.div = document.createElement("DIV");
            this.div.id = this.id();
            this.div.className = "card_container";

            var card_container = document.createElement("div");
            card_container.className = "card";

            card_container.appendChild(this.buildFront());
            card_container.appendChild(this.buildBack());

//            this.div.appendChild(this.buildFront());
//            this.div.appendChild(this.buildBack());
            this.div.appendChild(card_container);
        },

        buildBack: function() {
            var div = document.createElement("div");
            div.className = "face back";

            var label = document.createTextNode("Back");
            div.appendChild(label);

            return div;
        },

        buildFront: function() {
            var div = document.createElement("div");
            div.className = "face front";

            var label = document.createTextNode("Front");
            div.appendChild(label);

            return div;
        },

        handleClick: function(element) {
            console.log("Clicked ", this.translate(), $(this.div));
            $(this.div).find('.card').toggleClass('flipped');
        },

        display: function(parentDiv) {
            var parent = document.getElementById(parentDiv);
            parent.appendChild(this.div);
        }
    });

    return me;
}) (window.kadi.game || {}, jQuery);
