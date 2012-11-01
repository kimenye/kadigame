window.kadi = (function(me, $, undefined){
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
                    case kadi.Suite.HEARTS:
                    case kadi.Suite.DIAMONDS:
                        color = "red";
                        break;
                    case kadi.Suite.JOKERS:
                        if (rank == kadi.Card.JOKER_A)
                            color = "red";
                        break;
                }
                return color;
            },
            getSuiteSymbol: function(suite) {
                var symbol = "\u00a0" ;
                switch (suite) {
                    case kadi.Suite.CLUBS:
                        symbol = "\u2663";
                        break;
                    case kadi.Suite.DIAMONDS:
                        symbol = "\u2666";
                        break;
                    case kadi.Suite.HEARTS:
                        symbol = "\u2665";
                        break;
                    case kadi.Suite.SPADES:
                        symbol = "\u2660";
                        break;
                }
                return symbol;
            },
            getSuiteName: function(suite) {
                var name = "Joker";
                switch (suite) {
                    case kadi.Suite.CLUBS:
                        name = "Clubs";
                        break;
                    case kadi.Suite.DIAMONDS:
                        name = "Diamonds";
                        break;
                    case kadi.Suite.HEARTS:
                        name = "Hearts";
                        break;
                    case kadi.Suite.SPADES:
                        name =  "Spades";
                        break;
                    case kadi.Suite.ANY:
                        name = "Anything";
                        break;
                }
                return name;
            },
            getSuiteDiv: function(suite) {
                var div = document.createElement("div");
                div.className = "suite_picker";

                var symbol = kadi.Suite.getSuiteSymbol(suite);
                var classes = "medium " + kadi.Suite.getColorClass(suite, kadi.Card.ACE);

                var symbolDiv = kadi.createSpan(symbol, classes, null);
                div.appendChild(symbolDiv);
                return div;
            },
            getDeckOfCards: function() {
                var suites = [kadi.Suite.CLUBS,kadi.Suite.HEARTS,
                    kadi.Suite.DIAMONDS,kadi.Suite.SPADES];
//                suites = [kadi.Suite.CLUBS];
                var ranks = [kadi.Card.ACE,kadi.Card.TWO,kadi.Card.THREE,kadi.Card.FOUR,
                    kadi.Card.FIVE,kadi.Card.SIX,kadi.Card.SEVEN,kadi.Card.EIGHT,
                    kadi.Card.NINE,kadi.Card.TEN,kadi.Card.JACK,kadi.Card.QUEEN,
                    kadi.Card.KING];

                var cards = [];
                _.each(suites, function(suite) {
                    _.each(ranks, function(rank) {
                        cards.push(new me.CardUI(rank,suite));
                    });
                });

                cards.push(new me.CardUI(kadi.Card.JOKER_A,kadi.Suite.JOKERS));
                cards.push(new me.CardUI(kadi.Card.JOKER_A,kadi.Suite.JOKERS));

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
                    case kadi.Card.JOKER_A:
                        name = "Joker A";
                        break;
                    case kadi.Card.JOKER_B:
                        name = "Joker B";
                        break;
                    case kadi.Card.QUEEN:
                        name = "Queen";
                        break;
                    case kadi.Card.JACK:
                        name = "Jack";
                        break;
                    case kadi.Card.KING:
                        name = "King";
                        break;
                    case kadi.Card.ACE:
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
                return this.rank == kadi.Card.JOKER_A || this.rank == kadi.Card.JOKER_B;
            };
            this.isAce = function() {
                return this.rank == kadi.Card.ACE;
            };

            this.isQueen = function() {
                return this.rank == kadi.Card.QUEEN;
            };

            this.isFaceCard = function() {
                return this.isKing() || this.isQueen() || this.isJack();
            };

            this.is = function(rank) {
                return this.rank == rank;
            };

            this.isQuestion = function() {
                return this.isEight() || this.isQueen();
            };

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
            };

            this.eliminationValue = function() {
                var value = 0;
                switch (this.rank) {
                    case kadi.Card.ACE:
                        value = 100;
                        break;
                    case kadi.Card.TWO:
                        value = 50;
                        break;
                    case kadi.Card.THREE:
                        value = 75;
                        break;
                    case kadi.Card.JACK:
                    case kadi.Card.QUEEN:
                    case kadi.Card.KING:
                        value = 20;
                        break;
                    case kadi.Card.JOKER_A:
                    case kadi.Card.JOKER_B:
                        value = 500;
                        break;
                    default:
                        value = parseInt(this.rank);
                }

                return value;
            };

            this.isBlockingCard = function() {
                return this.isPickingCard() || this.isAce();
            };

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
                return this.rank == kadi.Card.KING;
            };

            this.isJack = function() {
                return this.rank == kadi.Card.JACK;
            };

            this.id = function() {
                return this.suite + ";" + this.rank;
            };

            this.toS = function(id) {
                var suiteName = kadi.Suite.getSuiteName(this.suite);
                var rankName = kadi.Card.getRankName(this.rank);
                if (this.rank == kadi.Card.JOKER_A || this.rank == kadi.Card.JOKER_B)
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
            this.activeForBlock = false;
            this.clickHandler = null;
        },
        
        moveCardUp : function() {
            this.container().css( 'cursor', 'pointer' );
            var top = Math.max(kadi.PlayerDeckUI.Y_A - 20, this.container().position().top - 20);
            this.moveTo(null,top,null);
        },
        
        moveCardDown : function() {
            this.container().css( 'cursor', 'default' );
            this.reset();
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
            this.container().dblclick(function() {
                SHOTGUN.fire(kadi.Events.CARD_DOUBLE_CLICKED, [self]);
            });
            this.container().hover(function() {
                if (self.active) {
                    self.moveCardUp();
                }
            }, function() {
                if (self.active && !self.selected) {
                    self.container().css( 'cursor', 'default' );
                    self.reset();
                }
            });

            this.reset = function() {
                var top = kadi.PlayerDeckUI.Y_A;
                this.deSelect();
                this.moveTo(null,top,null);
            };

            this.div = document.createElement("div");
            this.div.className = "card";

            this.div.appendChild(this.buildBack());
            this.div.appendChild(this.buildFront());

            this.card_container.appendChild(this.div);

            if (kadi.isChromeOnLinux()) {
                this.container().children().find('.front').removeClass('front').addClass('temp');
                this.container().children().find('.inner').css('display', 'none');
            }
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
            return kadi.Suite.getSuiteSymbol(this.suite);
        },

        buildSymbol: function(size) {
            var symbol = this.getSymbol();
            var classes = "suite " + kadi.Suite.getColorClass(this.suite, this.rank);

            classes = kadi.isSomethingMeaningful(size) ? classes + " " + size : classes;
            return kadi.createSpan(symbol, classes, null);
        },

        buildJokerText: function() {
            return kadi.createSpan(kadi.Card.getJokerRankText(),"rank joker " + kadi.Suite.getColorClass(this.suite, this.rank),null);
        },

        buildRankText: function() {
            return kadi.createSpan(this.rank, "rank " + kadi.Suite.getColorClass(this.suite, this.rank),null);
        },

        handleClick: function() {
            if (this.active) {
                this.select();
            }
            else if(this.activeForBlock) {
                this.clickHandler.callBack([this]);
            }
        },

        select: function() {
            var before = this.selected;
            this.selected = !this.selected;
            this.container().toggleClass('selected');
            if (before) {
                console.log("De-selecting ", this.toS());
                SHOTGUN.fire(kadi.Events.CARD_DESELECTED, [this]);
            }

            else
                SHOTGUN.fire(kadi.Events.CARD_SELECTED, [this]);
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

            if (kadi.isChromeOnLinux()) {
                var toShow = this.revealed;
                var toHide = !toShow;
                if (toHide) {
                    this.container().children().find('.front').removeClass('front').addClass('temp');
                    this.container().children().find('.inner').css('display', 'none');
                }
                else {
                    this.container().children().find('.temp').addClass('front').removeClass('temp');
                    this.container().children().find('.inner').css('display', 'block');
                }
            }
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
}) (window.kadi || {}, jQuery);
