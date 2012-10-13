describe("Multiplayer rules:", function() {

    var master = new kadi.game.Player('100004430102934',"Master One", true, false);
    var slaveOne = new kadi.game.Player('100004432652693',"Slave One", true, false);
    var slaveTwo = new kadi.game.Player('100004303570767',"Slave Two", true, false);

    it("Players can join a game room", function() {
        var playersOnline = 0;
        SHOTGUN.listen(kadi.game.Events.MEMBERSHIP_CHANGED, function(num, membership,add) {
            playersOnline = num;
        });

        master.initRealtime();

        waitsFor(function() {
            return playersOnline == 1;
        });

        runs(function() {
            expect(playersOnline).toBe(1);
            slaveOne.initRealtime();

            waitsFor(function() {
                return playersOnline == 2;
            });

            runs(function(){
                expect(playersOnline).toBe(2);
                SHOTGUN.remove(kadi.game.Events.MEMBERSHIP_CHANGED);
            });
        });
    });
});

(function() {
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 500;
    jasmineEnv.defaultTimeoutInterval = 10000;

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