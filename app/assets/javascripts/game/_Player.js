var Player = JS.Class({
    construct: function(roarPlayerId,fbId,name,roarApi, syncHandler) {
        this.roarPlayerId = roarPlayerId;
        this.fbId = fbId;
        this.name = name;
        this.roarApi = roarApi;
        this.synced = false;
        this.syncHandler = syncHandler;
        this.membershipChangedHandler = null;
        this.inviteReceviedHandler = null;
        this.inviteAcceptedHandler = null;
        this.sync();
    },

    initRealtime: function() {
        var self = this;
        Pusher.log = function(message) {
//            if (window.console && window.console.log) window.console.log(message);
        };
        Pusher.channel_auth_endpoint = "/pusher/presence/auth";

        var _pusher = new Pusher("3b40830094bf454823f2", { encrypted: true, auth: { params: { userid: this.fbId, name: this.name } } });

        _pusher.connection.bind('connected', function() {
            self.socketId = _pusher.connection.socket_id;
            console.log("Connected to the realtime server");
        });
        this.pusher = _pusher;

        this._presence = this.pusher.subscribe("presence-gameroom");

        this._presence.bind('pusher:subscription_error', function(msg) {
            console.log("Subscription error", msg);
        });

        this._presence.bind('pusher:subscription_succeeded', function() {
            console.log("Subscribed to the presence channel");
            if (isSomethingMeaningful(self.membershipChangedHandler)) {
                self.membershipChangedHandler.callBack(self._presence.members.count)
            }
        });

        this._presence.bind('pusher:member_added', function(member) {
            console.log("A member has been added", member.id);
            if (isSomethingMeaningful(self.membershipChangedHandler)) {
                self.membershipChangedHandler.callBack(self._presence.members.count)
            }
        });

        this._presence.bind('pusher:member_removed', function(member) {
            console.log("Member " + member.id + " has left");
            if (isSomethingMeaningful(self.membershipChangedHandler)) {
                self.membershipChangedHandler.callBack(self._presence.members.count)
            }
        });

        this._presence.bind('client-game-invite', function(invite) {
            self._simplyHandle(self.inviteReceviedHandler, invite);
        });

        this._presence.bind('client-game-invite-accepted', function(invite) {
            self._simplyHandle(self.inviteAcceptedHandler, invite);
        });
    },

    /**
     * Accepts an invite from another player
     *
     * @param invite
     * @param acceptHandler
     */
    acceptInvite : function(invite, acceptHandler) {
        this._simplySend(this._presence,'client-game-invite-accepted', { to: invite.from, from: this.fbId }, acceptHandler);
    },

    /**
     * Sends an invite to another player
     *
     * @param id
     * @param inviteHandler
     */
    invite: function(id, inviteHandler) {
        this._simplySend(this._presence,'client-game-invite', { to: id, from: this.fbId }, inviteHandler);
    },

    /**
     * Returns the players online, excluding the current user
     */
    getPlayersOnLine: function() {
        var players = [];
        if (isSomethingMeaningful(this._presence)) {
            var self = this;
            this._presence.members.each(function(member) {
                if (member.id != self._presence.members.me.id) {
                    players.push({
                        id: member.id,
                        name: member.info.name
                    });
                }
            });
        }
        return players;
    },

    /**
     * Returns the number of players online. This includes the current user
     *
     * @return {*}
     */
    getNumberOfPlayersOnline: function() {
        if (isSomethingMeaningful(this._presence)) {
            return Math.max(this._presence.members.count,1);
        }
        else
            return 1; //yourself
    },

    /**
     * Synchronizes the roar data with the server
     */
    sync: function() {
        var self = this;
        $.post('/player/sync', { fb_id: this.fbId, roar_id: this.roarPlayerId }, function(data) {
            self.synced = data.success;
            self.roarApi.viewUser(new Handler(self._readRoarUserData, self));
            self.initRealtime();
        });
    },

    /**
     * Reads attributes from ROAR
     *
     * @param result
     * @private
     */
    _readRoarUserData: function(result) {
        var success = result[0];
        var raw = result[1];
        window.raw = raw;
        if (success) {
            var attributes = raw.find('attribute');

            this.xp = this._findAttributeValue(attributes, 'xp');
            this.level = this._findAttributeValue(attributes, 'level');
            this.credits = this._findAttributeValue(attributes, 'premium_currency');

            if (isSomethingMeaningful(this.syncHandler)) {
                this.syncHandler.callBack(this);
            }
        }
    },

    /**
     * This is a simple send method that sends a client event
     *
     * @param channel
     * @param event
     * @param message
     * @param handler
     * @private
     */
    _simplySend: function(channel, event, message, handler) {
        if (isSomethingMeaningful(channel)) {
            channel.trigger(event, message);
            handler.callBack(true);
        }
    },

    /**
     * This is a simple handler for very basic events. It just checks if the message
     * is for the intended recipient then it runs the callback with the message as
     * the parameter
     *
     * @param handler
     * @param message
     * @private
     */
    _simplyHandle: function(handler,message) {
        if (this._msgIsForMe(message)) {
            this._invoke(handler,message);
        }
    },

    _invoke : function(handler,params) {
        if (isSomethingMeaningful(handler))
            handler.callBack(params);
    },

    _msgIsForMe : function(msg) {
        return (isSomethingMeaningful(msg.to) && msg.to == this.fbId)
    },

    _findAttributeValue : function(collection, name) {
        var attr = this._findAttribute(collection, name);
        if (isSomethingMeaningful(attr)) {
            return $(attr).attr('value');
        }
    },

    _findAttribute: function(collection, name) {
        return _.detect(collection, function(item) {
            return $(item).attr('ikey') == name;
        });
    }
});