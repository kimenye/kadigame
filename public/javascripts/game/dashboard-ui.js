var View = JS.Class({
    construct: function(name, template) {
        this.name = name;
        this.template = template;
    }
});

function DashboardApplication() {
    var self = this;
    this.xp = ko.observable();
    this.level = ko.observable();
    this.credits = ko.observable();
    this.numPlayersOnline = ko.observable();
    this.player = null;
    this.views = ko.observableArray([new View('Invite FB Friends','invite-friends')]);
    this.selectedView = ko.observable(this.views()[0]);

    this.setPlayer = function(player) {
        this.player = player;
        this.xp(player.xp);
        this.level(player.level);
        this.credits(player.credits);
        this.updatePlayersOnline(player.getPlayersOnline());
        player.membershipChangedHandler = new Handler(this.updatePlayersOnline, this);

    }

    this.updatePlayersOnline = function(num) {
        this.numPlayersOnline(num);
    }
}
