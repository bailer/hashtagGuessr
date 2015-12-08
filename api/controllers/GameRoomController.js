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
        return res.view('gameroom');
      } else {
          res.notFound();
      }
    });
  },

  getOpenGameRooms: function(req, res) {
    if (req.isSocket) {
      GameRoom.find({active: false}).populateAll().exec(function findCB(err, found) {
        GameRoom.watch(req);
        GameRoom.subscribe(req, _.pluck(found, 'id'));
        res.json(found);
      });
    } else {
      res.badRequest("not a socket");
    }
  },

  initGameRoom: function (req, res) {
    if (req.isSocket) {
      gameRoomId = req.param('id');
      GameRoom.findOne(gameRoomId).populateAll().exec(function (err, found) {
        if (found) {
          GameRoom.subscribe(req, found.id);
          return res.json({gameRoom: found, socketId: req.socket.id});
        } else {
          return res.badRequest("room does not exist");
        }
      });
    } else {
      return res.badRequest("not a socket");
    }
  },

  playerReady: function(req, res) {
    gameRoomId = req.param('gameRoomId');
    playerId = req.param('playerId');
    socketId = req.param('socketId');
    socketRoom = 'gameRoom'+gameRoomId;
    Player.update(playerId, {ready: true}).exec(function (err, updated) {
      if (updated[0]) {
        Player.publishUpdate(updated[0].id, updated[0]);
        sails.sockets.join(socketId, socketRoom);
        sails.sockets.join(socketId, "waitingGameRooms");
        GameRoom.findOne(gameRoomId).populateAll().exec(function (err, found) {
          if (found) {
            var allReady = true;
            for (var i = 0; i < found.players.length; i++) {
              if (found.players[i].ready == false) {
                console.log("found non ready player");
                allReady = false;
                break;
              }
            }
            if (allReady) {
              GameRoom.update(found.id,{active: true}).exec(function afterwards(err, updated) {
                if (updated[0]) {
                  GameRoom.publishUpdate(updated[0].id, updated[0]);
                  var subscribers = GameRoom.subscribers(updated[0].id);
                  _.each(subscribers, function(subscriber) {
                    GameRoom.unsubscribe(subscriber, updated[0].id);
                  })
                }
              });
              var toSend = TwitterStream.track(found);
              sails.sockets.broadcast(socketRoom, "countdownToStart", toSend);
            }
          }
        });
      }
    });
    return res.ok();
  }
};

