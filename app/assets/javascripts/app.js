// This is a manifest file that'll be compiled into including all the files listed below.
// Add new JavaScript/Coffee code in separate files in this directory and they'll automatically
// be included in the compiled file accessible from http://example.com/assets/application.js
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// the compiled file.
//
//= require game/common-ui
//= require game/card
//= require game/game-ui
//= require game/player-ui
//= require game/game-dom
//= require game/rules

$(document).ready(function () {
    var me = new kadi.game.Player('100004430102934', "You",true);
    var compB = new kadi.game.Player('FD03', 'Karucy',false);
    var compC = new kadi.game.Player('O03', 'Makmende',false);
    var compD = new kadi.game.Player('O02', 'Prezzo',false);
    kadi.game.initGameUI(me,[compD, compB, compC]);
});