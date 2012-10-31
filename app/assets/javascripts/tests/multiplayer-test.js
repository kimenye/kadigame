describe("Multiplayer tests:", function() {

    it("Returns a socket ID when it connects to the pusher service", function() {
        var firstPlayer = new kadi.Player('100004303570767', 'Wills', false);
        var sync = new kadi.RealtimeSync(firstPlayer, true);

        waitsFor(function() {
            return sync.connected;
        });

        runs(function() {
            expect(sync.socketId).not.toBeNull();
            sync.disconnect();
            waitsFor(function() {
                return !sync.connected;
            });
        });
    });
});