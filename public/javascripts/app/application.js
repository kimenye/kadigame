window.kadi.app = (function(me, $, undefined){

    me.MultiplayerApplication = JS.Class({
        construct: function(fbAccessToken, fbId, playerName) {
            SHOTGUN.listen(kadi.game.Events.MEMBERSHIP_CHANGED, function(num) {
                console.log("New number of members:", num);
            });

            this.me = new kadi.game.GamePlayerUI({id: fbId, name: playerName, live: true});
        }
    });

    return me;
}) (window.kadi.app || {}, jQuery);