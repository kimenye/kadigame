window.kadi.app = (function(me, $, undefined){

    me.Update = JS.Class({
        construct: function(message,when) {
            var self = this;
            this.when = when;
            this.lastUpdated = ko.observable(new Date());
            this.message = message;
            this.at = ko.computed(function() {
                var dt = self.lastUpdated();
                console.log("Last updated ", moment(self.when).fromNow());
                return moment(self.when).fromNow();
            });
        }
    });

    me.Invite = me.Update.extend({
        construct: function(from,when) {
            this.parent.construct.apply(this, [from.name + " wants to play KADI!", when]);
            this.from = from;
        }
    });

    me.MultiplayerApplication = JS.Class({
        construct: function(fbAccessToken, fbId, playerName) {
            var self = this;
            this.numOnline = ko.observable(1);
            this.debug = true;
            this.debug = false;
//            this.me = new kadi.game.GamePlayerUI({id: fbId, name: playerName, live: true});
            this.game = new kadi.game.MultiPlayerGame({id: fbId, name: playerName, live: true});
            this.me = this.game.me;
            this.me.display('player');
            this.players = ko.observableArray([]);
            this.inGame = ko.observable(false);
//            this.players.push(this.me);
            this.invites = ko.observableArray([]);
            this.updates = ko.observableArray([]);
            this.numInvites = ko.computed(function() {
                return self.invites().length;
            });

            var chaos = new kadi.game.GamePlayerUI({ id: '625987307', name: 'Chaos', live: false});
//            this.game.master();
//            this.game.sitPlayer(chaos);

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

                var invite = new me.Invite(from, when);
                if (self.debug) {
                    self.acceptInvite(invite);
                }
                else {
                    self.invites.push(invite);
                    $('#online').collapse('hide');
                    $('#invites').collapse('show');
                }
            });

            SHOTGUN.listen(kadi.game.Events.INVITE_ACCEPTED, function(fromId, when) {
                $('.invite').hide();
                var invitedPlayer = _.detect(self.players(), function(p) { return p.id == fromId });
                self.game.master();
                self.game.sitPlayer(invitedPlayer);
                self.inGame(true);
            });

            this.me.initRealtime();
            this.game.display();

            this.acceptInvite = function(invite) {
                self.invites([]); //remove all invites
                $('.invite').hide();
                self.me.acceptInvite(invite.from.id);
                self.game.slave();
                self.game.sitPlayer(invite.from);
                self.inGame(true);
            }
            this.declineInvite = function(invite) {
                self.invites(_.reject(self.invites(), function(i) {
                    return i.from.eq(invite.from);
                }));
            }
            $('#sidebar').show();

            setInterval(function() {
                // Do something every 5 seconds
                self.updateDurations();
            }, 60000);
        },
        updateDurations: function() {
            _.each(this.invites(), function(invite) {
                invite.lastUpdated(new Date());
            });
            _.each(this.updates(), function(update) {
                update.lastUpdated(new Date());
            });
        },
        startGame: function() {
            $('.btn-start-game').button('loading');
            this.me.sendInvites();
            this.game.setType(kadi.game.MultiPlayerGame.TYPE_MASTER);
        }
    });
    return me;
}) (window.kadi.app || {}, jQuery);