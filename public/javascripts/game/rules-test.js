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