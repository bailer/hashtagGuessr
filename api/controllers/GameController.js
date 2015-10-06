/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

 module.exports = {
  startGame: function(req, res) {
    return res.render('index', { 
      test: 'Game time!' 
    });
  },

  inLobby: function(req, res) {
    sails.sockets.join(req.socket, 'lobby');
    console.log(sails.sockets.id(req.socket) + " joined lobby");
  },

  socketSetup: function(req, res) {
    var socket = sails.sockets.id(req.socket);
    console.log(socket);
    // setTimeout(function () {
    //   sails.sockets.emit(socket,'boom', "blasted!");
    // }, 3000);
    return res.ok('My socket ID is: '+ socket);
  }
};

