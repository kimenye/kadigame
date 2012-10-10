window.kadi.admin = (function(me, $, undefined){

    me.AdminApplication = JS.Class({
        construct: function() {
            this.roar = new kadi.app.Roar(null,'836254');

            this.deletePlayer = function(id,name,roarId) {
                if (!kadi.isSomethingMeaningful(roarId)) {
                    alert('Cannot delete a user who has not yet logged into roar');
                    return;
                }
                if (confirm("Are you sure you want to delete the user " + name + " ?")) {
                    var handler = new kadi.Handler(function(success) {
                        $('#delete-form-' +  id).submit();
                    });
                    this.roar.deletePlayer(roarId, handler);
                }
            }
        }
    });

    return me;
}) (window.kadi.admin || {}, jQuery);

$(document).ready(function () {
    console.log("Admin application is ready");
    ko.applyBindings(new kadi.admin.AdminApplication(), $("#players")[0]);
});
