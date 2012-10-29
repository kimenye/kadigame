describe("Integration tests:", function() {

    var player = new kadi.game.Player('100004183626950', 'Trevor', true, 0, 0, 0);

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