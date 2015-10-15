/**
 * TestController
 *
 * @description :: Server-side logic for managing tests
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  socket: function (req, res) {
    console.log(req.socket.id + " has connected");
    res.json({'socketId': req.socket.id});
  }
	
};

