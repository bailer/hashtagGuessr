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

  initGameRoom: function (req, res) {
    if (req.isSocket) {
      gameRoomId = req.param('id');
      console.log(sails.sockets.timeoutObjects);
      // timeoutObject = sails.sockets.timeoutObjects[gameRoomId]
      // if (timeoutObject) {
      //   clearTimeout(timeoutObject);
      // }
      console.log("in init gameroom "+req.session.id);
      console.log("in init gameroom " + req.session.userId);
      GameRoom.findOne(gameRoomId).populateAll().exec(function (err, found) {
        if (found) {
          GameRoom.subscribe(req, found.id);
          if (req.session.userId) {
            console.log("has user id");
            console.log("socket:");
            console.log(req.socket.id);
            Player.update(req.session.userId, {socketId: req.socket.id}).exec(function (err, updated) {
              console.log("updated?");
              console.log(updated);
              if (err) {
                console.log("error");
                console.log(err)
              } else if (updated[0]) {
                return res.json({gameRoom: found, player: updated[0]});
              }
            })
          } else {
            return res.json({gameRoom: found, socketId: req.socket.id});
          }
        } else {
          return res.badRequest("room does not exist");
        }
      });
    } else {
      return res.badRequest("not a socket");
    }
  },

  playerReady: function(req, res) {
    console.log("READY!");
    if (req.isSocket) {
      gameRoomId = req.param('gameRoomId');
      guess = req.param('guess');
      playerId = req.session.userId;
      socketId = req.socket.id;
      socketRoom = 'gameRoom'+gameRoomId;
      console.log("joining socketroom: " + socketRoom + " with socket: " + socketId + " for player: " + playerId);
      Player.update(playerId, {ready: true, guess: guess}).exec(function (err, updated) {
        if (updated[0]) {
          Player.publishUpdate(updated[0].id, updated[0]);
          sails.sockets.join(socketId, socketRoom);
          sails.sockets.join(socketId, "waitingGameRooms");
          GameRoom.findOne(gameRoomId).populateAll().exec(function (err, found) {
            if (found) {
              var allReady = true;
              for (var i = 0; i < found.players.length; i++) {
                if (found.players[i].ready == false) {
                  allReady = false;
                  break;
                }
              }
              if (allReady) {
                GameRoom.update(found.id,{active: true}).exec(function afterwards(err, updated) {
                  if (updated[0]) {
                    GameRoom.publishUpdate(updated[0].id, updated[0]);
                    // var subscribers = GameRoom.subscribers(updated[0].id);
                    // _.each(subscribers, function(subscriber) {
                    //   GameRoom.unsubscribe(subscriber, updated[0].id);
                    // });
                    var toSend = TwitterStream.track(found);
                    sails.sockets.broadcast(socketRoom, "countdownToStart", toSend);
                  }
                });
              }
            }
          });
        }
      });
      return res.ok();
    } else {
      return res.badRequest("not a socket");
    }
  }
};

