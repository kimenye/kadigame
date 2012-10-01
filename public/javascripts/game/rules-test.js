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