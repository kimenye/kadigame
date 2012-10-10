window.kadi.app = (function(me, $, undefined){

    me.Roar = JS.Class({
        statics: {
            APP_NAME: "kaditest",
            LOGIN_OAUTH: "/facebook/login_oauth/",
            buildMethodUrl: function(method_path) {
                return "http://api.roar.io/" + me.Roar.APP_NAME + method_path;
            },
            getStatus: function(response, method) {
//            <roar tick="128455548872">
//                <info>
//                    <user status="error">
//                        <error type="0">Player does not exist</error>
//                    </user>
//                </info>
//            </roar>
                return $(response).find(method).attr('status') == 'ok';
            }
        },
        construct : function(fb_auth_token, admin_token) {
            this.fb_auth_token = fb_auth_token;
            this.roar_auth_token = null;
            this.admin_token = admin_token;
        },

        /**
         * Try to log into roar first. If unsuccessful, then create a user
         */
        createRoarUserOrLogin : function(handler) {
            var self = this;
            var createdHandler = new Handler(function(params) {
                var created = params[0], roarAuthToken = params[1], roarPlayerId = params[2];
                if (created) {
                    this.roar_auth_token = roarAuthToken;
                    handler.callBack([true, roarPlayerId]);
                }
            });

            //first check if the user has been logged in
            var loginHandler = new Handler(function(params) {
                var loggedIn = params[0];
                var roarAuthToken = params[1];
                var roarPlayerId = params[2];

                if (loggedIn) {
                    self.roar_auth_token = roarAuthToken;
                    console.log("Roar token is : ", roarAuthToken);
                    handler.callBack([loggedIn, roarPlayerId]);
                }
                else {
                    console.log("Login failed so attempting to call create");
                    self._facebookCreateOAuth(createdHandler);
                }
            }, this);

            this._loginToRoar(loginHandler);
        },

        /**
         * Calls the /user/view method
         *
         * @param handler
         */
        viewUser : function(handler) {
            if (this.isLoggedIn() && !this.isAdmin()) {
                console.log("About to view a user with token : ", this.roar_auth_token);
                var url = Roar.buildMethodUrl("/user/view/");
                $.post(url, { auth_token: this.roar_auth_token }, function(data) {
                    var success = Roar.getStatus(data, 'view');
                    var view = $(data).find('view');
                    handler.callBack([success, view]);
                });
            }
        },

        /**
         * Delete a player from the Roar engine. Requires an admin token.
         *
         * @param playerId
         * @param handler
         */
        deletePlayer : function(playerId, handler) {
            if (this.isAdmin()) {
                var url = me.Roar.buildMethodUrl('/admin/delete_player/');
                console.log("Going to delete user with id ", playerId);
                $.post(url, { admin_token: this.admin_token, player_id: playerId }, function(data) {
                    var success = me.Roar.getStatus(data, 'delete_player');
                    handler.callBack(success);
                });
            }
            else
                handler.callBack(false);
        },

        _facebookCreateOAuth : function(handler) {
            if (!this.isAdmin()) {
                console.log("About to create user in roar ", this.fb_auth_token);
                var method_name = '/facebook/create_oauth/';
                var url = me.Roar.buildMethodUrl(method_name);
                var _self = this;
                $.post(url, { oauth_token: this.fb_auth_token }, function(data) {
                    var success = me.Roar.getStatus(data, 'create_oauth');
                    console.log("Created in Roar : %s", success);
                    var params = [success];
                    if (success) {
                        params.push($(data).find('auth_token').text());
                        params.push($(data).find('player_id').text());
                    }

                    handler.callBack(params);
                });
            }
        },

        _loginToRoar : function(handler) {
            if (!this.isAdmin()) {
                console.log("About to log in to roar ", this.fb_auth_token);
                var url = me.Roar.buildMethodUrl(me.Roar.LOGIN_OAUTH);
                var _self = this;
                $.post(url, { oauth_token: this.fb_auth_token  }, function(data) {
                    var loggedIn = me.Roar.getStatus(data, 'login_oauth');
                    console.log("Logged into roar: ", loggedIn);
                    var _params = [loggedIn];

                    if (loggedIn) {
                        _params.push($(data).find('auth_token').text());
                        _params.push($(data).find('player_id').text());
                    }
                    handler.callBack(_params);
                });
            }
        },

        /**
         * Is there an auth token
         */
        isLoggedIn : function() {
            return kadi.isSomethingMeaningful(this.roar_auth_token);
        },

        /**
         * Returns true or false if this object is for an admin
         */
        isAdmin : function() {
            return kadi.isSomethingMeaningful(this.admin_token);
        }
    });

    me.Member = JS.Class({
        construct: function(fbAccessToken, fbId, playerName) {
            this.fbAccessToken = fbAccessToken;
            this.fbId = fbId;
            this.welcomeMsg = playerName;
            this.profileImage = kadi.fbProfileImage(fbId, "normal");
            this.roar = me.Roar(fbAccessToken);
        },
        init: function(handler) {
            var createOrLoginHandler = new kadi.Handler(function(params) {
                console.log("Success: %s The player is %s ", params[0], params[1]);
            });
//            -#var createOrLoginHandler = new Handler(function(params) {
//                -#  console.log("Success: %s The player is %s ", params[0], params[1]);
//                -#
//    -#  var dashboard = new DashboardApplication(false);
//                -#  var syncHandler = new Handler(function(player) {
//                    -#     dashboard.setPlayer(player);
//                    -#  });
//                -#  var player = new Player(params[1], fb_id, name, roar, syncHandler);
//                -#
//    -#
//    -#  ko.applyBindings(dashboard, $("#dashboard")[0]);
//                -#});
        }
    });

    me.MultiplayerApplication = JS.Class({
        construct: function(fbAccessToken, fbId, playerName) {
            this.member = new me.Member(fbAccessToken,fbId,playerName);
        }
    });

    return me;
}) (window.kadi.app || {}, jQuery);