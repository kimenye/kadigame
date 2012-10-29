describe("Integration tests:", function() {

    describe("A player", function() {
        var player = new kadi.Player('100004183626950', 'Trevor', true, 0, 0, 0);

        it("Can manage a player", function() {
            expect(player).not.toBeNull();
            expect(player.id).not.toBeNull();
            expect(player.id).toBe('100004183626950');
            expect(player.name).not.toBeNull();
            expect(player.name).toBe('Trevor');
            expect(player.live).toBe(true);
        });

        it("Customizes the name when required to", function() {
            expect(player.name).toBe('Trevor');
            expect(player.displayName(true)).toBe('You');
        });

        it("Tells between a bot and real player", function() {
            expect(player.isBot()).toBe(false);
            player.live = false;
            expect(player.isBot()).toBe(true);
        });
    });

    describe("A deck", function() {
        var deck = new kadi.Deck();

        it("A deck can manage cards", function() {
            deck.cards = [];
            expect(deck.isEmpty()).toBe(true);
            deck.addCard(kadi.spades("5"));
            expect(deck.isEmpty()).toBe(false);

            deck.removeCard(kadi.spades("6"));
            expect(deck.isEmpty()).toBe(false);
            deck.removeCard(kadi.spades("5"));
            expect(deck.isEmpty()).toBe(true);
        });
    });

    describe("A game", function() {
        var compA = new kadi.Player('100004303570767', 'Wills',false);
        var compB = new kadi.Player('100004432652693', 'Prezzo',false);
        var compC = new kadi.Player('100004430102934', 'Smally',false);

        var players = [compA, compB, compC];

        it("Game Options are mutually exclusive", function() {
            var options = new kadi.GameOptions(kadi.GameOptions.MODE_ELIMINATION, kadi.GameOptions.ONE_CARD_KADI, kadi.GameOptions.PICKING_MODE_TOP_ONLY);
            expect(options.isEliminationMode()).toBe(true);
            expect(options.isFirstToWin()).toBe(false);
            expect(options.canFinishWithMultipleCards()).toBe(false);
            expect(options.mustFinishWithOnlyOneCard()).toBe(true);
            expect(options.canPickOnlyTheTopCard()).toBe(true);
            expect(options.mustPickAllTheCards()).toBe(false);

            options = new kadi.GameOptions(kadi.GameOptions.MODE_FIRST_TO_WIN, kadi.GameOptions.ANY_CARDS_KADI, kadi.GameOptions.PICKING_MODE_ALL);
            expect(options.isEliminationMode()).not.toBe(true);
            expect(options.isFirstToWin()).not.toBe(false);
            expect(options.canFinishWithMultipleCards()).not.toBe(false);
            expect(options.mustFinishWithOnlyOneCard()).not.toBe(true);
            expect(options.canPickOnlyTheTopCard()).not.toBe(true);
            expect(options.mustPickAllTheCards()).not.toBe(false);
        });
    });
});