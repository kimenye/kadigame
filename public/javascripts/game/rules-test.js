//helper functions

function diamonds(rank) {
    return new kadi.game.Card(rank, kadi.game.Suite.DIAMONDS);
}
function spades(rank) {
    return new kadi.game.Card(rank, kadi.game.Suite.SPADES);
}
function hearts(rank) {
    return new kadi.game.Card(rank, kadi.game.Suite.HEARTS);
}
function clubs(rank) {
    return new kadi.game.Card(rank, kadi.game.Suite.CLUBS);
}

function joker(t) {
    return new kadi.game.Card("0", kadi.game.Suite.JOKERS);
}

describe("Card rules:", function() {

    var rule = new kadi.game.RuleEngine();

    it("Only valid cards can start", function() {
        var king = diamonds("K");
        expect(kadi.game.RuleEngine.canStart(king)).toBe(false);

        var queen = hearts("Q");
        expect(kadi.game.RuleEngine.canStart(queen)).toBe(false);

        var five = hearts("5");
        expect(kadi.game.RuleEngine.canStart(five)).toBe(true);
    });

    it("Cards of the same suite can follow each other", function() {
        var random_spade_card = spades("6");
        var other_spade_card = spades("5");
        var cant_follow = diamonds("4");

        expect(kadi.game.RuleEngine.canFollow(random_spade_card, other_spade_card)).toBe(true);
        expect(kadi.game.RuleEngine.canFollow(other_spade_card,random_spade_card)).toBe(true);
        expect(kadi.game.RuleEngine.canFollow(other_spade_card,cant_follow)).toBe(false);
    });

    it("Cards of a different suite but same rank can follow each other", function() {
        var rank = "4";
        var random_diamond = diamonds(rank);
        var random_spade = spades(rank);

        expect(kadi.game.RuleEngine.canFollow(random_diamond,random_spade)).toBe(true);
    });

    it("An ace can follow any card", function() {
        var any_card = diamonds("Q");
        var an_ace = spades("A");

        expect(kadi.game.RuleEngine.canFollow(an_ace,any_card));
    });

    it("Any card can follow a joker", function() {
        var anyCard = diamonds("Q");
        var j = joker("0");

        expect(kadi.game.RuleEngine.canFollow(anyCard, j)).toBe(true);
        expect(kadi.game.RuleEngine.canFollow(j, anyCard)).toBe(true);
    });

    it("A card can be be in a move with another if they are the same rank", function() {
        var five_d = diamonds("5");
        var five_s = spades("5");

        expect(kadi.game.RuleEngine.canPlayTogetherWith(five_d, five_s)).toBe(true);
    });

    it("A card cannot be in a move with another if they are not the same rank", function() {
        var five_d = diamonds("5");
        var six_d = diamonds("6");

        expect(kadi.game.RuleEngine.canPlayTogetherWith(five_d, six_d)).toBe(false);
    });

    it("An ace can not be in a move a non ace card", function() {
        var five_d = diamonds("5");
        var ace = diamonds("A");

        expect(kadi.game.RuleEngine.canPlayTogetherWith(five_d, ace)).toBe(false);
    });

    it("A queen cannot finish a move", function() {
        var card = diamonds("Q");
        expect(kadi.game.RuleEngine.canEndMove(card)).toBe(false);

        card = diamonds("K");
        expect(kadi.game.RuleEngine.canEndMove(card)).toBe(true);

        card = diamonds("Q");
        expect(kadi.game.RuleEngine.canEndMove(card)).toBe(false);
    });

    describe("Queen rules", function() {

        it("A queen can play together with another queen", function() {
            var q_d = diamonds("Q");
            var q_s = spades("Q");

            expect(kadi.game.RuleEngine.canPlayTogetherWith(q_d, q_s)).toBe(true);
        });

        it("A queen can play together with another ordinary card of the same suite", function() {
            var q_d = diamonds("Q");
            var seven_d = diamonds("7");
            var seven_c = clubs("7");

            expect(kadi.game.RuleEngine.canPlayTogetherWith(q_d, seven_d)).toBe(true);
            expect(kadi.game.RuleEngine.canPlayTogetherWith(q_d, seven_c)).toBe(false);
        });

        it("An eight can act as a queen", function() {
            var eight_d = diamonds("8");
            var seven_d = diamonds("7");

            expect(kadi.game.RuleEngine.canPlayTogetherWith(eight_d, seven_d)).toBe(true);
        });
    });

    describe("Picking card rules", function() {

        it("An ace can block any picking card", function() {

            var h = [diamonds("A"), diamonds("5")];

            expect(kadi.game.RuleEngine.canBlock(h)).toBe(true);
        });

        it("An ordinary card cannot block a picking card", function() {

            var h = [diamonds("5")];
            expect(kadi.game.RuleEngine.canBlock(h)).toBe(false);
        });

        it("Any picking card block another picking card", function() {

            var h = [diamonds("3"), spades("5"), clubs("J")];

            expect(kadi.game.RuleEngine.canBlock(h)).toBe(true);
        });

        it("A picking move cannot mix a picking card and an ace", function() {
            var h = [diamonds("3"), spades("A")];

            expect(kadi.game.RuleEngine.canBlock(h)).toBe(true);
            expect(kadi.game.RuleEngine.isValidBlockingMove(h)).toBe(false);
            expect(kadi.game.RuleEngine.isValidBlockingMove([spades("A")])).toBe(true);
            expect(kadi.game.RuleEngine.isValidBlockingMove([spades("3"), clubs("2")])).toBe(true);

        });
    });
});

describe("Move rules:", function() {

    var startingCard = diamonds("10");
    var hand, deck, computer, board;

    it("No moves are possible if no cards can follow", function() {
        hand = [hearts("2"),spades("3"),hearts("4"),clubs("4")];
        expect(kadi.game.RuleEngine.possibleMoves(startingCard, hand).length).toBe(0);
    });

    it("Multiple moves are possible without grouping cards", function() {
        hand = [diamonds("5"), diamonds("6"), spades("K"), spades("A")];
        expect(kadi.game.RuleEngine.possibleMoves(diamonds("10"),hand).length).toBe(3);
    });

    describe("Group rules", function() {

        it("A group is a series of cards that an be played together", function() {
            var g = [clubs("6"), diamonds("6")];
            expect(kadi.game.RuleEngine.evaluateGroup(g)).toBe(true);

            g = [clubs("7"), clubs("8")];
            expect(kadi.game.RuleEngine.evaluateGroup(g)).toBe(false);

            g = [clubs("Q"), clubs("7")];
            expect(kadi.game.RuleEngine.evaluateGroup(g)).toBe(true);
        });

        it("Any non playable cards in a set makes the group invalid", function() {
            var g = [clubs("Q"), clubs("7"), diamonds("8")];
            expect(kadi.game.RuleEngine.evaluateGroup(g)).toBe(false);
        });

        it("All consecutive cards must be playable for the cards to form a group", function() {
            var g = [clubs("Q"), clubs("7"), diamonds("7")];
            expect(kadi.game.RuleEngine.evaluateGroup(g)).toBe(true);
        });

        it("A group requires at least 2 cards in a hand", function() {
            var h = [clubs("3")];
            expect(kadi.game.RuleEngine.group(h, null).length).toBe(0);
        });

        it("A group does not exist if no cards in a hand can be played together even if they can follow each other", function () {
            var h = [diamonds("5"), diamonds("6")];
            expect(kadi.game.RuleEngine.group(h, null).length).toBe(0);
        });

        it("A group exists if more than one cards in a hand can be played together", function () {
            var h = [spades("4"), clubs("4"), hearts("3"), spades("5")];
            var tC = spades("6");
            expect(kadi.game.RuleEngine.group(h,tC).length).toBe(1);
        });

        it("A group with more cards is more valuable than one with less", function() {
            var h = [spades("4"), clubs("4"), hearts("4"), spades("5"), hearts("5")];
            expect(kadi.game.RuleEngine.group(h,spades("6")).length).toBe(2);

            var group = kadi.game.RuleEngine.bestGroup(h,spades("6"));
            expect(group.length).toBe(3);
        });

        it("It can play selections", function() {
            var h = [diamonds("5"), spades("5")];
            expect(kadi.game.RuleEngine.canPlay(h, diamonds(9))).toBe(true);

            h = [hearts("K"), clubs("10"), spades("A")];
            expect(kadi.game.RuleEngine.canPlay(h, clubs("A"))).toBe(true);
        });
    });
});

describe("Game mechanics:", function() {
    var playerA = new kadi.game.Player('A', 'Player A');
    var playerB = new kadi.game.Player('B', 'Player B');
    var playerC = new kadi.game.Player('C', 'Player C');
    var playerD = new kadi.game.Player('D', 'Player D');

    it("Returns the next player", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        expect(order.current().eq(playerA)).toBe(true);
        expect(order.current().eq(playerB)).toBe(false);
    });

    it("When clockwise the index moves incrementally", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        order.next();
        expect(order.current().eq(playerB)).toBe(true);
    });


    it("Peek tells you who the next turn will be without affecting the run of play", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        order.next();
        expect(order.current().eq(playerB)).toBe(true);
        var next = order.peek();
        expect(next.eq(playerC)).toBe(true);
    });

    it("When anti-clockwise the index moves incrementally", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        order.direction = kadi.game.PlayingOrder.ANTI_CLOCKWISE;
        order.next();
        expect(order.current().eq(playerD)).toBe(true);
    });

    it("Turn reversal changes the direction of the game", function() {
        var order = new kadi.game.PlayingOrder([playerA, playerB, playerC, playerD], 0);
        order.next();
        expect(order.current().eq(playerB)).toBe(true);
        order.reverse();
        expect(order.current().eq(playerA)).toBe(true);
    });

    it("A King causes a reverse action", function() {
        var king = spades("K");
        var h = [king];
        var action = kadi.game.RuleEngine.actionRequired(h);
        expect(action).toBe(kadi.game.RuleEngine.ACTION_REVERSE);
    });

    it("An ordinary card causes no action", function() {
        var five = spades("5");
        expect(five.isOrdinary()).toBe(true);
        var h = [five];
        var action = kadi.game.RuleEngine.actionRequired(h);
        expect(action == kadi.game.RuleEngine.ACTION_NONE).toBe(true);
    });

    it("A picking card causes a picking or block action", function() {
        var card = spades("2");
        expect(card.isPickingCard()).toBe(true);
        var h = [card];
        var action = kadi.game.RuleEngine.actionRequired(h);
        expect(action == kadi.game.RuleEngine.ACTION_PICK_OR_BLOCK).toBe(true);
    });

    it("Two causes two cards to be picked", function() {
        var card = spades("2");
        var h = [card];

        expect(kadi.game.RuleEngine.calculatePicking(h)).toBe(2);
    });

    it("Three causes two cards to be picked", function() {
        var card = spades("3");
        var h = [card];

        expect(kadi.game.RuleEngine.calculatePicking(h)).toBe(3);
    });

    it("Joker causes 5 cards to be picked", function() {
        var card = joker("0");
        var h = [card,spades("3")];

        expect(kadi.game.RuleEngine.calculatePicking(h)).toBe(8);
    });

    it("A Question card causes an incomplete action", function() {
        var card = spades("Q");
        var h = [card];
        var action = kadi.game.RuleEngine.actionRequired(h);
        expect(action == kadi.game.RuleEngine.ACTION_INCOMPLETE).toBe(true);
    });

    it("A Jack card causes a skip action", function() {
        var card = spades("J");
        var h = [card];
        var action = kadi.game.RuleEngine.actionRequired(h);
        expect(action == kadi.game.RuleEngine.ACTION_SKIP).toBe(true);
    });
});

describe("Utilities:", function() {
    it("Executes a handler when it is called", function() {
        var toUpdate = false;
        var handler = new kadi.Handler(function() {
            toUpdate = true;
        });
        handler.callBack();
        expect(toUpdate).toBe(true);
    });

    it("Picks the oldest cards", function() {
        var spade = spades("2");
        var last = clubs("J");
        var deck = [spade, spades("5"), hearts("A"), hearts("5"), clubs("5"), last , diamonds("J"), diamonds("K"), diamonds("A"), clubs("Q")];

        expect(deck.length).toBe(10);
        var oldest = _.initial(deck, 5);

        var rest = _.rest(deck,5);

        expect(oldest.length).toBe(5);
        expect(rest.length).toBe(5);

        expect(_.first(oldest).eq(spade)).toBe(true);
        expect(_.first(rest).eq(last)).toBe(true);
    });

    it("Can check if a hand has any rank", function() {
        var hand = [spades("2"), spades("3")];

        expect(kadi.containsCardOfRank(hand, "2")).toBe(true);
        expect(kadi.containsCardOfRank(hand, "J")).toBe(false);
    });

    it("Returns the highest picking card", function() {
        var hand = [spades("5"), spades("2")];
        expect(kadi.highestPickingCard(hand).eq(spades("2"))).toBe(true);

        hand.push(diamonds("3"));
        expect(kadi.highestPickingCard(hand).eq(diamonds("3"))).toBe(true);

        hand.push(joker("0"));
        expect(kadi.highestPickingCard(hand).eq(joker("0"))).toBe(true);
    });
});

(function() {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 250;

    var htmlReporter = new jasmine.HtmlReporter();
    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function(spec) {
        return htmlReporter.specFilter(spec);
    };

    var currentWindowOnload = window.onload;
    window.onload = function() {
        if (currentWindowOnload) {
            currentWindowOnload();
        }

        document.querySelector('.version').innerHTML = jasmineEnv.versionString();
        execJasmine();
    };

    function execJasmine() {
        jasmineEnv.execute();
    }
})();