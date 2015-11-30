/**
 * GameRoomController
 *
 * @description :: Server-side logic for managing Gamerooms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  serveGameRoom: function(req, res) {
    console.log(req.id + "connected to gameroom " + req.param('id'));
    return res.view('gameroom');
  },

  // socket init
  initGameRoom: function (req, res) {
    gameRoomId = req.param('id');
    // console.log("Serving gameroom" + gameRoomId);
    GameRoom.findOne(gameRoomId).populateAll().exec(function (err, found) {
      if (found) {
        GameRoom.subscribe(req, found.id);
        // console.log("Found: %j", found);
        if (found.players.length == 0) {
          // console.log("Creating new player");
          found.players.add({socketId: req.socket.id});
          found.save(function (err, result) {
            if (err) {
              console.log(err);
            } else {
              return res.json({gameRoom: result, socketId: req.socket.id});
            }
          });
          // Player.create({inGameRoom: gameRoomId, socketId: req.socket.id}, function (err, created) {
          //   res.json(response);
          // });
        } else {
          return res.json({gameRoom: found, socketId: req.socket.id});
        }
      }
    });
  },

  startGame: function(req, res) {
    gameRoomId = req.param('id');
    socketRoom = 'gameRoom'+gameRoomId;
    players = [];
    GameRoom.findOne(gameRoomId).populateAll().exec(function (err, found) {
      if (found) {
        found.players.forEach(function (o, i, a) {
          sails.sockets.join(o.socketId, socketRoom);
          sails.sockets.join(o.socketId, "waitingGameRooms");
          players.push(o);
        });
        var toSend = TwitterStream.track(found);
        return res.json(toSend);
        // setTimeout(function () {
        //   TwitterStream.track(found, res);
        // }, 30000);
      }
    });
    // return res.ok();
  }
};

