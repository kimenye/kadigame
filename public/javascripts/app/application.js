window.kadi.app = (function(me, $, undefined){

    me.MultiplayerApplication = JS.Class({
        construct: function(fbAccessToken, fbId, playerName) {
            var self = this;
            this.numOnline = ko.observable(1);
            this.me = new kadi.game.GamePlayerUI({id: fbId, name: playerName, live: true});

            this.players = ko.observableArray([]);
            this.players.push(this.me);

            SHOTGUN.listen(kadi.game.Events.MEMBERSHIP_CHANGED, function(num, membership,add) {
                self.numOnline(num);

                if (_.isArray(membership)) {
                    _.each(membership, function(member) {
                        if (member.id != self.me.id) {
                            var player = new kadi.game.GamePlayerUI({id: member.id, name: member.info.name });
                            if (add)
                                self.players.push(player);
                            else {
                                self.players(_.reject(self.players(), function(p) { return p.id == player.id }));
                            }
                        }
                    });
                }
            });

            this.game = new kadi.game.MultiPlayerGame(this.me);

//            this.me.initRealtime();
            this.game.display();

            $('#sidebar').show();
        }
    });
    return me;
}) (window.kadi.app || {}, jQuery);