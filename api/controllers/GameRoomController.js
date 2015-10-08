/**
 * GameRoomController
 *
 * @description :: Server-side logic for managing Gamerooms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  serveGameRoom: function(req, res) {
    console.log(req.id + "connected to gameroom " + req.param('id'));
    res.view('gameroom');
  }
};

