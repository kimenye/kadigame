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
});