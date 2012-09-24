var BackgroundUI = JS.Class({
    construct : function(imagePath,targetLayer,x,y) {
        var _self = this;

        var _bgImageObj = new Image();
        _bgImageObj.onload = function() {
            var _img = new Kinetic.Image({
                x: isSomethingMeaningful(x) ? x : 0,
                y: isSomethingMeaningful(y) ? y : 0,
                image: _bgImageObj
            });

            targetLayer.add(_img);
            _img.moveToBottom();
            targetLayer.draw();

            console.log("Loaded splash screen. Z-index ", _img.getZIndex());
//            SHOTGUN.fire(Constants.EVENT_READY, ["splash","Splash screen loaded"],'splash');
        };
        _bgImageObj.src = imagePath;
    }
});



var GameUI = JS.Class({
    statics: {
        width: 800,
        height: 600
    },
    construct: function(me, opponents) {
        var self = this;
        this.me = me;
        this.opponents = [];
        this.opponents = _.collect(opponents, function(opponent) {
            return new GamePlayerUI(opponent.id, opponent.name);
        });

        console.log("Preparing stage");

        this.stage = new Kinetic.Stage({
            container: "game",
            width: GameUI.width,
            height: GameUI.height
        });

        this.backgroundLayer = new Kinetic.Layer();

        this.bg = new BackgroundUI("images/woodback.jpg", this.backgroundLayer, 0, 0);
        this.stage.add(this.backgroundLayer);

//        var bBox = new BoundingBox(600, 200,150,180);
//        var pickingDeck = new PickingDeck({ bBox: bBox, cardSize: new Size(146,180) }, 54);
//        this.cards = [];
//        _.each(pickingDeck.cards, function(c) {
//            self.cards.push(new Card(self.backgroundLayer, { x:c.xMin(), y:c.yMin(), idx: c.idx }));
//        });

        /*var ace = new CardUI(Card.ACE, Suite.CLUBS);
        ace.draw(self.backgroundLayer, {x: 120, y: 50 });

        var two = new CardUI("2", Suite.DIAMONDS);
        two.draw(self.backgroundLayer, {x: 220, y: 50 }); */

//        var joker = new CardUI(Card.JOKER, Suite.DIAMONDS,true);
//        joker.draw(self.backgroundLayer, {x: 520, y: 200 });

        /*var seven = new CardUI("7", Suite.HEARTS);
        seven.draw(self.backgroundLayer, {x: 320, y: 50 });

        var three = new CardUI("3", Suite.HEARTS);
        three.draw(self.backgroundLayer, {x: 420, y: 50 });

        var eight = new CardUI("8", Suite.SPADES);
        eight.draw(self.backgroundLayer, {x: 520, y: 50 });

        var four = new CardUI("4", Suite.DIAMONDS);     http://zachwaugh.com/helveticards/index.html
        four.draw(self.backgroundLayer, {x: 120, y: 200 });

        var five = new CardUI("5", Suite.SPADES);
        five.draw(self.backgroundLayer, {x: 220, y: 200 });

        var six = new CardUI("6", Suite.CLUBS);
        six.draw(self.backgroundLayer, {x: 320, y: 200 });

        var nine = new CardUI("9", Suite.DIAMONDS);
        nine.draw(self.backgroundLayer, {x: 420, y: 200 });

        var queen = new CardUI(Card.QUEEN, Suite.DIAMONDS);
        queen.draw(self.backgroundLayer, {x: 120, y: 350 });

        var jack = new CardUI(Card.JACK, Suite.DIAMONDS);
        jack.draw(self.backgroundLayer, {x: 220, y: 350 });*/

        var king = new CardUI(Card.KING, Suite.DIAMONDS,true);
        king.draw(self.backgroundLayer, {x: xCenterInFrame(GameUI.width, CardUI.width), y: xCenterInFrame(GameUI.height, CardUI.height) });

        window.card = king;
        var myHand = new HandUI({x: 400, y: 595},self.backgroundLayer);
//        myHand.draw();
        myHand.addCard(king,true);

    }
});
