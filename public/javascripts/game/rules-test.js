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

describe("Card rules:", function() {

    var rule = new kadi.game.RuleEngine();

    it("Only valid cards can start", function() {
        var king = new kadi.game.Card(kadi.game.Card.KING,kadi.game.Suite.DIAMONDS);
        expect(kadi.game.RuleEngine.canStart(king)).toBe(false);

        var queen = new kadi.game.Card(kadi.game.Card.JACK, kadi.game.Suite.HEARTS);
        expect(kadi.game.RuleEngine.canStart(queen)).toBe(false);

        var five = new kadi.game.Card(kadi.game.Card.FIVE, kadi.game.Suite.HEARTS);
        expect(kadi.game.RuleEngine.canStart(five)).toBe(true);
    });

    it("Cards of the same suite can follow each other", function() {
        var random_spade_card = new kadi.game.Card("6",kadi.game.Suite.SPADES);
        var other_spade_card = new kadi.game.Card("5",kadi.game.Suite.SPADES);
        var cant_follow = new kadi.game.Card("4",kadi.game.Suite.DIAMONDS);

        expect(kadi.game.RuleEngine.canFollow(random_spade_card, other_spade_card)).toBe(true);
        expect(kadi.game.RuleEngine.canFollow(other_spade_card,random_spade_card)).toBe(true);
        expect(kadi.game.RuleEngine.canFollow(other_spade_card,cant_follow)).toBe(false);
    });

    it("Cards of a different suite but same rank can follow each other", function() {
        var rank = "4";
        var random_diamond = new kadi.game.Card(rank,kadi.game.Suite.DIAMONDS);
        var random_spade = new kadi.game.Card(rank,kadi.game.Suite.DIAMONDS);

        expect(kadi.game.RuleEngine.canFollow(random_diamond,random_spade)).toBe(true);
    });

    it("An ace can follow any card", function() {
        var any_card = new kadi.game.Card("Q", kadi.game.Suite.DIAMONDS );
        var an_ace = new kadi.game.Card("A", kadi.game.Suite.SPADES);

        expect(kadi.game.RuleEngine.canFollow(an_ace,any_card));
    });

    it("A card can be be in a move with another if they are the same rank", function() {
        var five_d = new kadi.game.Card("5", kadi.game.Suite.DIAMONDS);
        var five_s = new kadi.game.Card("5", kadi.game.Suite.SPADES);

        expect(kadi.game.RuleEngine.canPlayTogetherWith(five_d, five_s)).toBe(true);
    });

    it("A card cannot be in a move with another if they are not the same rank", function() {
        var five_d = new kadi.game.Card("5", kadi.game.Suite.DIAMONDS);
        var six_d = new kadi.game.Card("6", kadi.game.Suite.DIAMONDS);

        expect(kadi.game.RuleEngine.canPlayTogetherWith(five_d, six_d)).toBe(false);
    });

    it("An ace can not be in a move a non ace card", function() {
        var five_d = new kadi.game.Card("5", kadi.game.Suite.DIAMONDS);
        var ace = new kadi.game.Card("A", kadi.game.Suite.DIAMONDS);

        expect(kadi.game.RuleEngine.canPlayTogetherWith(five_d, ace)).toBe(false);
    });

    it("A queen cannot finish a move", function() {
        var card = new kadi.game.Card("Q", kadi.game.Suite.DIAMONDS);
        expect(kadi.game.RuleEngine.canEndMove(card)).toBe(false);

        card = new kadi.game.Card("K", kadi.game.Suite.DIAMONDS);
        expect(kadi.game.RuleEngine.canEndMove(card)).toBe(true);

        card = new kadi.game.Card("Q", kadi.game.Suite.DIAMONDS);
        expect(kadi.game.RuleEngine.canEndMove(card)).toBe(false);
    });

    describe("Queen rules", function() {

        it("A queen can play together with another queen", function() {
            var q_d = new kadi.game.Card("Q", kadi.game.Suite.DIAMONDS);
            var q_s = new kadi.game.Card("Q", kadi.game.Suite.SPADES);

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