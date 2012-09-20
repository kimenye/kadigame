var View = JS.Class({
    construct: function(name, template) {
        this.name = name;
        this.template = template;
    }
});

var PlayerUI = JS.Class({
    construct: function(p) {
        var self = this;
        this.id = ko.observable(p.id);
        this.name = ko.observable(p.name);
        this.photo = ko.observable("https://graph.facebook.com/" + p.id + "/picture");
        this.canAcceptInvite = ko.observable(false);
        this.invite = null;

        this.disableInvite = ko.computed(function() {
            return ! self.canAcceptInvite();
        });
    }
});

function DashboardApplication(debug) {
    var self = this;
    this.debug = debug;
    this.xp = ko.observable();
    this.level = ko.observable();
    this.credits = ko.observable();
    this.numPlayersOnline = ko.observable();
    this.playersOnline = ko.observableArray([]);
    this.player = null;
    this.views = ko.observableArray([new View('Invite FB Friends','invite-friends')]);
    this.selectedView = ko.observable(this.views()[0]);

    this.setPlayer = function(player) {
        this.player = player;
        this.xp(player.xp);
        this.level(player.level);
        this.credits(player.credits);
        this.updatePlayersOnline(player.getNumberOfPlayersOnline());
        player.membershipChangedHandler = new Handler(this.updatePlayersOnline, this);
        player.inviteReceviedHandler = new Handler(this.handleInviteReceived, this);
        player.inviteAcceptedHandler = new Handler(this.handleInviteAccepted, this);
    }

    this.updatePlayersOnline = function(num) {
        this.numPlayersOnline(num);
        var users = [];
        _.each(self.player.getPlayersOnLine(), function(p) {
            users.push(new PlayerUI(p));
        });
        self.playersOnline(users);

        if (self.debug)
        {
            var first = _.first(self.playersOnline());
            if (isSomethingMeaningful(first)) {
                self.inviteToPlay(first);
            }
        }
    }

    this.inviteToPlay = function(player) {
        console.log("About to invite %s to play", player.name());
        $('#btn-' + player.id()).button('loading');
        var sentHandler = new Handler(function() {
            $('#btn-' + player.id()).button('progress');
        }, self);

        self.player.invite(player.id(), sentHandler);
    }

    this.acceptInvite = function(player) {
        console.log("Accepting invite from ", player.name());
        var acceptedHandler = new Handler(function() {
            $('#btn-accept-' + player.id()).button('loading');
            $('#btn-accept-' + player.id()).toggleClass('btn-success');
        }, this);
        self.player.acceptInvite(player.invite, acceptedHandler);
    }

    this.handleInviteAccepted = function(invite) {
        console.log("Invite from %s has been accepted, time to start a new game ", invite.from);
        $('#btn-' + invite.from).button('complete');
        $('#dashboard').slideUp();
    }

    this.handleInviteReceived = function(invite) {
        var fromId = invite.from;
        var from = this.getPlayer(fromId);

        if (isSomethingMeaningful(from)){
            from.canAcceptInvite(true);
            from.invite = invite;

            if (this.debug) {
                this.acceptInvite(from);
            }
        }
    }

    this.getPlayer = function(id) {
        return _.detect(this.playersOnline(), function(p) {
            return p.id() == id;
        });
    }
}
