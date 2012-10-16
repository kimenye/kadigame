//function deleteUser() {
//
//}

function AdminApplication() {

}

function PlayersApplication() {

    this.roar = new Roar(null,'836254');
    var self = this;
    console.log("Roar Admin : ", this.roar.isAdmin());
    this.deletePlayer = function(id,name,roarId) {
        if (!isSomethingMeaningful(roarId)) {
            alert('Cannot delete a user who has not yet logged into roar');
            return;
        }
        if (confirm("Are you sure you want to delete the user " + name + " ?")) {
            var handler = new Handler(function(success) {
                  $('#delete-form-' +  id).submit();
            });
            self.roar.deletePlayer(roarId, handler);
        }
    }
}

$(document).ready(function () {
    console.log("Admin application is ready");

    var playersApp = new PlayersApplication();
    ko.applyBindings(playersApp, $("#players")[0]);
});
