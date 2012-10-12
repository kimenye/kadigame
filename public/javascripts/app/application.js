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
//            this.me = new kadi.game.GamePlayerUI({id: fbId, name: playerName, live: true});
            this.game = new kadi.game.MultiPlayerGame({id: fbId, name: playerName, live: true});
            this.me = this.game.me;
            //this.me.display();
            this.players = ko.observableArray([]);
            this.inGame = ko.observable(false);
            this.players.push(this.me);
            this.invites = ko.observableArray([]);
            this.numInvites = ko.computed(function() {
                return self.invites().length;
            });

            this.canStartGame = ko.computed(function() {
                return self.numInvites() < 1 && self.numOnline() > 1  && !self.inGame();
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

            SHOTGUN.listen(kadi.game.Events.INVITE_ACCEPTED, function(fromId, when) {
//                var from = _.detect(self.players(), function(p) { return p.id == fromId });
                self.inGame(true);
            });

            this.me.initRealtime();
            this.game.display();

            this.acceptInvite = function(invite) {
                self.invites([]); //remove all invites
                self.me.acceptInvite(invite.id);
                self.inGame(true);
            }
            this.declineInvite = function(invite) {
                self.invites(_.reject(self.invites(), function(i) {
                    return i.from.eq(invite.from);
                }));
            }
            $('#sidebar').show();
        },
        startGame: function() {
            $('.btn-start-game').button('loading');
            this.me.startGame();
        }
    });
    return me;
}) (window.kadi.app || {}, jQuery);