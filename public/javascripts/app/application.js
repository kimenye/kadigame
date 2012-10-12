window.kadi.app = (function(me, $, undefined){

    me.Invite = JS.Class({
        construct: function(from,at) {
            this.from = from;
            this.at = moment(at).fromNow();
        }
    });

    me.MultiplayerApplication = JS.Class({
        construct: function(fbAccessToken, fbId, playerName) {
            var self = this;
            this.numOnline = ko.observable(1);
            this.me = new kadi.game.GamePlayerUI({id: fbId, name: playerName, live: true});
            this.players = ko.observableArray([]);
            this.players.push(this.me);
            this.invites = ko.observableArray([]);
            this.numInvites = ko.computed(function() {
                return self.invites().length;
            });

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

            SHOTGUN.listen(kadi.game.Events.INVITE_RECEIVED, function(fromId,when) {
                var from = _.detect(self.players(), function(p) { return p.id == fromId });

                self.invites.push(new me.Invite(from, when));
                $('#online').collapse('hide');
                $('#invites').collapse('show');
            });

            this.game = new kadi.game.MultiPlayerGame(this.me);

            this.me.initRealtime();
            this.game.display();

            $('#sidebar').show();
        },
        startGame: function() {
            $('.btn-start-game').button('loading');
            this.me.startGame();
        }
    });
    return me;
}) (window.kadi.app || {}, jQuery);