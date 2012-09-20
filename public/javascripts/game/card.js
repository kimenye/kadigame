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
        }
    }
});

var CardUI = Card.extend({

    construct: function(rank,suite) {
        this.parent.construct.apply(this, [rank,suite]);
    },

    color: function() {
        if(this.suite == Suite.CLUBS || this.suite == Suite.SPADES)
            return "black";
        else
            return "red";
    },
    draw: function(parent, options) {
        var bgImageObj = new Image();
        var self = this;
        bgImageObj.onload = function() {
            var img = new Kinetic.Image({
                x: options.x,
                y: options.y,
                image: bgImageObj,
                draggable: true,
                width: 100,
                height: 136
            });

            var group = new Kinetic.Group({ draggable: true })
            group.add(img);

            if (!self.isJoker()) {
                var rankText = new Kinetic.Text({
                    x: options.x + 10,
                    y: options.y + 10,
                    fontSize: 12,
                    fontFamily: 'MuseoSans-500',
                    text: self.rank,
                    textFill: self.color()
                });

                var suiteSymbol = new Kinetic.Text({
                    x: options.x + 9,
                    y: options.y + 30,
                    fontSize: 10,
                    text: Suite.getSuiteSymbol(self.suite),
                    textFill: self.color()
                });

                group.add(rankText);
                group.add(suiteSymbol);
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
                group.add(rankText);
            }
            parent.add(group);
            parent.draw();
        }
        bgImageObj.src = 'images/card_back_small.png';
    }

});