window.kadi.app = (function(me, $, undefined){

    me.MultiplayerApplication = JS.Class({
        construct: function(fbAccessToken, fbId, playerName) {
//            SHOTGUN.listen(kadi.game.Events.MEMBERSHIP_CHANGED, function(num) {
//                console.log("New number of members:", num);
//            });

            this.me = new kadi.game.GamePlayerUI({id: fbId, name: playerName, live: true});

            this.game = new kadi.game.MultiPlayerGame(this.me);

            this.me.initRealtime();
            this.game.display();
            this.sidebar = new kadi.app.SideBar();

            $('#sidebar').show();
            ko.applyBindings(this.sidebar);
        }
    });

    me.SideBar = JS.Class({
       construct: function() {
//           this.parent.construct.apply(this, ['game-container', 'sidebar', 'span2']);
       }
    });

    return me;
}) (window.kadi.app || {}, jQuery);