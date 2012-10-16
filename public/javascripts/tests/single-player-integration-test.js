describe("Single Player Integration Rules:", function() {

    describe("Game creation mechanics", function() {

        var firstPlayer = new kadi.game.Player("1", "First Player",false,true);
        var secondPlayer = new kadi.game.Player("2", "Second Player",false,true);
        var thirdPlayer = new kadi.game.Player("3", "Third Player",false,true);
        var fourthPlayer = new kadi.game.Player("4", "Fourth Player",false,true);

        it("Sets the correct game type", function() {
            var game = new kadi.game.SinglePlayerGame(firstPlayer, [secondPlayer, thirdPlayer, fourthPlayer]);
            expect(game.type).toBe(kadi.game.Game.TYPE_SINGLE_PLAYER);
        });


    });
});