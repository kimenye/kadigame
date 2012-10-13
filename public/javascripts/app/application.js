window.kadi.app = (function(me, $, undefined){

    me.Update = JS.Class({
        construct: function(message,when) {
            var self = this;
            this.when = when;
            this.lastUpdated = ko.observable(new Date());
            this.message = message;
            this.at = ko.computed(function() {
                var dt = self.lastUpdated();
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
        construct: function(fbAccessToken, fbId, playerName, master) {
            var self = this;
            this.numOnline = ko.observable(1);
            this.debug = true;
            this.master = kadi.getVal(master);
//            console.log("Master: %s, Debug: %s", this.master, this.debug);
            this.game = new kadi.game.MultiPlayerGame({id: fbId, name: playerName, live: true});
            this.me = this.game.me;
            this.me.display('player');
            this.players = ko.observableArray([]);
            this.inGame = ko.observable(false);
            this.invites = ko.observableArray([]);
            this.updates = ko.observableArray([]);

//            var chaos = new kadi.game.GamePlayerUI({ id: '625987307', name: 'Chaos', live: false});
//            this.game.master();
//            this.game.sitPlayer(chaos);
//            this.game.startGame();

            this.stream = ko.computed(function() {
                return _.sortBy(self.updates(), function(u) { return u.when }).reverse();
            });

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

                if (self.master && self.debug) {
//                    console.log("Can send invites...Sending invites...", self.master, self.debug);
                    self.sendInvites();
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
                $('#online').collapse('hide');
                $('#invites').collapse('hide');
                $('#stream').collapse('show');
                self.updates.push(new me.Update(invitedPlayer.name + " has joined the game",new Date()));

//                console.log("Received invite acceptance event");
                self.game.startGame();
            });

            SHOTGUN.listen(kadi.game.Events.MSG_RECEIVED, function(msg) {
                self.updates.push(new me.Update(msg,new Date()));
            });

            this.me.initRealtime();
            this.me.initHandlers();
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
        sendInvites: function() {
            $('.btn-start-game').button('loading');
            this.me.sendInvites();
            this.game.setType(kadi.game.MultiPlayerGame.TYPE_MASTER);
        }
    });
    return me;
}) (window.kadi.app || {}, jQuery);