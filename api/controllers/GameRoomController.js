/**
 * GameRoomController
 *
 * @description :: Server-side logic for managing Gamerooms
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  serveGameRoom: function(req, res) {
    gameRoomId = req.param('id');
    GameRoom.findOne(gameRoomId).exec(function (err, found) {
      // will have to add support for reconnection here
      if (found && !found.active) {
        console.log("served gameroom " + gameRoomId);
        return res.view('gameroom');
      } else {
          res.notFound();
      }
    });
  },

  getOpenGameRooms: function(req, res) {
    GameRoom.find({active: false}).populateAll().exec(function findCB(err, found) {
      if (req.isSocket) {
        GameRoom.watch(req);
      }
      res.json(found);
    })
  },

  initGameRoom: function (req, res) {
    if (req.isSocket) {
      gameRoomId = req.param('id');
      GameRoom.findOne(gameRoomId).populateAll().exec(function (err, found) {
        if (found) {
          GameRoom.subscribe(req, found.id);
          return res.json({gameRoom: found, socketId: req.socket.id});
        }
      });
    }
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
          GameRoom.update(found.id,{active: true}).exec(function afterwards(err, updated) {
            if (err) {
              console.log("couldn't set gameroom " + found.id + "to active");
            } else {
              GameRoom.publishUpdate(found.id,{active: true});
              console.log("updated gameroom " + found.id);
            }
          });
        });
        var toSend = TwitterStream.track(found);
        return res.json(toSend);
      }
    });
  }
};

