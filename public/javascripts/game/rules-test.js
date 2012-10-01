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
        var random_spade_card = new kadi.game.Card(kadi.game.Suite.SPADES, "6");
        var other_spade_card = new kadi.game.Card(kadi.game.Suite.SPADES, "5");
        var cant_follow = new kadi.game.Card(kadi.game.Suite.DIAMONDS, "4");

        expect(kadi.game.RuleEngine.canFollow(random_spade_card, other_spade_card)).toBe(true);
        expect(kadi.game.RuleEngine.canFollow(other_spade_card,random_spade_card)).toBe(true);
        expect(kadi.game.RuleEngine.canFollow(other_spade_card,cant_follow)).toBe(false);
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