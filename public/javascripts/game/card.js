var Suite = JS.Class({
   statics : {
       CLUBS: "C",
       HEARTS: "H",
       DIAMONDS: "D",
       SPADES: "S",
       getSuiteSymbol: function(suite) {
           var symbol = "\u00a0" ;
           switch (suite) {
               case Suite.CLUBS:
                   symbol = "\u2663";
                   break;
               case Suite.DIAMONDS:
                   symbol = "\u2666";
                   break;
               case Suite.HEARTS:
                   symbol = "\u2665";
                   break;
               case Suite.SPADES:
                   symbol = "\u2660";
                   break;
           }
           return symbol
       }
   }
});

var Card = JS.Class({
    statics : {
        JOKER: "JOKER",
        QUEEN: "Q",
        JACK: "J",
        KING: "K",
        ACE: "A"
    },
    construct : function(rank,suite) {
        this.suite = suite;
        this.rank = rank;
        this.isJoker = function() {
            return this.rank == Card.JOKER;
        };
        this.isAce = function() {
            return this.rank == Card.ACE;
        };

        this.isQueen = function() {
            return this.rank == Card.QUEEN;
        };

        this.isEight = function() {
            return this.rank == 8;
        };

        this.isKing = function() {
            return this.rank == Card.KING;
        };

        this.isJack = function() {
            return this.rank == Card.JACK;
        };
    }
});

var HandUI = JS.Class({

    construct: function(origin,parent) {
        this.origin = origin;
        this.parent = parent;
        this.cards = [];
    },
    draw: function() {
        var circle = new Kinetic.Circle({
            x: this.origin.x,
            y: this.origin.y,
            radius: 5,
            fill: "black",
            stroke: "black",
            strokeWidth: 1
        });
        parent.add(circle);
        parent.draw();
    },
    addCard: function(card,draw) {
        this.cards.push(card);
//        if (draw,)
    },
    calculatePosition: function(card, idx, numCards) {
//        if (idx =)
    },
    _drawCards : function() {
        if (this.cards.length == 0) {

        }
    }
});

var CardUI = Card.extend({

    statics: {
        height: 136,
        width: 100
    },

    construct: function(rank,suite,showFace) {
        this.parent.construct.apply(this, [rank,suite]);
        this.showFace = isSomethingMeaningful(showFace) ? showFace : false;
    },

    color: function() {
        if(this.suite == Suite.CLUBS || this.suite == Suite.SPADES)
            return "black";
        else
            return "red";
    },
    rotate : function(degrees) {
        this.group.rotate(degrees);
        this.p.draw();
    },

    moveOffset: function(x,y) {
        this.group.setOffset(x,y);
        this.p.draw();
    },

    draw: function(parent, options) {
        var bgImageObj = new Image();
//        var backImageObj = new Image();
        var self = this;
        self.p = parent;
        bgImageObj.onload = function() {
            var img = new Kinetic.Image({
                x: options.x,
                y: options.y,
                image: bgImageObj,
                draggable: true,
                width: CardUI.width,
                height: CardUI.height
            });

            var group = new Kinetic.Group({ draggable: true });
//            group.setOffset(320, 320);

            console.log("Offset", group.getOffset());
//            group.rotate(.18);
            group.add(img);

//            img.setScale({x:-1});

            group.on('click', function() {
                group.moveToTop();
            });

            group.on("dragstart", function() {
                group.moveToTop();
            });

            if (!self.isJoker()) {
                var rankText = new Kinetic.Text({
                    x: options.x + 10,
                    y: options.y + 10,
                    fontSize: 18,
                    fontFamily: 'MuseoSans-500',
                    text: self.rank,
                    textFill: self.color()
                });

                var suiteSymbol = new Kinetic.Text({
                    x: options.x + 9,
                    y: options.y + 35,
                    fontSize: 12,
                    fontFamily: 'MuseoSans-500',
                    text: Suite.getSuiteSymbol(self.suite),
                    textFill: self.color()
                });

                if (!self.isQueen() && !self.isKing() && !self.isJack()) {

                    var suiteSymbolMain = new Kinetic.Text({
                        x: options.x + 20,
                        y: options.y + 55,
                        fontSize: 48,
                        fontFamily: 'MuseoSans-500',
                        text: Suite.getSuiteSymbol(self.suite),
                        textFill: self.color()
                    });

                    if (self.showFace)
                        group.add(suiteSymbolMain);
                }

                if (self.showFace)
                {
                    group.add(rankText);
                    group.add(suiteSymbol);
                }
                parent.add(group);
                parent.draw();
            }
            else
            {
                /*var imgJoker = new Image();
                imgJoker.onload = function() {

                    var jokerImg = new Kinetic.Image({
                        x: options.x + 10,
                        y: options.y + 10,
                        image: imgJoker,
                        draggable: true,
                        width: 100,
                        height: 136
                    });

                    group.add(jokerImg);
                    parent.add(group);
                    parent.draw();
                }
                imgJoker.src = 'images/makmende.png';*/
                var rankText = new Kinetic.Text({
                    x: options.x + 10,
                    y: options.y + 10,
                    fontSize: 12,
                    fontFamily: 'MuseoSans-500',
                    text: "J\n0\nK\nE\n\R",
                    textFill: self.color()
                });

//                rankText.setScale({x:-1});
//                rankText.scale(-1,-1);
                if (self.showFace)
                    group.add(rankText);
//                group.setScale({x:-1,y:-1});
            }
//            group.rotate(-.1);
            parent.add(group);
            parent.draw();
            self.group = group;
        }
        if (self.showFace)
            bgImageObj.src = 'images/card_back_small.png';
        else
            bgImageObj.src = 'images/card_back_coke.png';
    }

});