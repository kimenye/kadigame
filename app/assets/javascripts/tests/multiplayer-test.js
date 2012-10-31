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

    it("Returns the number of members connected to the presence service", function() {
        var count = 0;

        SHOTGUN.listen(kadi.RealtimeSync.EVENT_CHANNEL_SUBSCRIBED, function(channel, memberCount) {
            count = memberCount;
        });

        SHOTGUN.listen(kadi.RealtimeSync.EVENT_MEMBER_ADDED, function(channel, member, memberCount) {
            count = memberCount;
        });

        SHOTGUN.listen(kadi.RealtimeSync.EVENT_MEMBER_LEFT, function(channel, member, memberCount) {
            count = memberCount;
        });

        var firstPlayer = new kadi.Player('100004303570767', 'Wills', false);
        var sync = new kadi.RealtimeSync(firstPlayer, true);

        waitsFor(function() {
            return sync.connected;
        });

        runs(function() {
            expect(count).toBe(1);

            var syncB = new kadi.RealtimeSync(new kadi.Player('100004303570747', 'Wills 2', false), true);

            waitsFor(function() {
                return syncB.connected;
            });

            runs(function() {
                expect(count).toBe(2);

                sync.disconnect();

                waitsFor(function() {
                   return count == 1;
                });

                runs(function() {
                    syncB.disconnect();
                    SHOTGUN.remove(kadi.RealtimeSync.EVENT_MEMBER_LEFT);
                    SHOTGUN.remove(kadi.RealtimeSync.EVENT_MEMBER_ADDED);
                    SHOTGUN.remove(kadi.RealtimeSync.EVENT_CHANNEL_SUBSCRIBED);
                });
            });
        });
    });
});