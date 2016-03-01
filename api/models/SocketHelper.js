/**
 * SocketHelper.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

 gameRoomTimeout = 30000;
 gameRoomTimeoutObjects = {};

module.exports = {

  addGameRoomTimer: function(id, timerObject) {
    gameRoomTimeoutObjects[id] = timerObject;
  },

  clearGameRoomTimer: function(id) {
    if (gameRoomTimeoutObjects[id]) { 
      clearTimeout(gameRoomTimeoutObjects[id]);
      gameRoomTimeoutObjects[id] = null;
    }
  },

  attributes: {

  }
};

