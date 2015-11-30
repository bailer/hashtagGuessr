/**
* GameRoom.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    name: {
      type: 'string',
      required: true
      // unique: true
    },
    password: {
      type: 'string'
    },
    players: {
      collection: 'Player',
      via: 'inGameRoom'
    },
    gameTime: {
      type: 'integer',
      defaultsTo: 60000
    },
    active: {
      type: 'boolean',
      defaultsTo: 'false'
    }
  },

  // afterCreate: function(gameRoom, cb) {
  //   sails.sockets.broadcast('lobby', 'addGameRoom', gameRoom);
  //   console.log("Sent addGameRoom to lobby");
  //   cb();
  // },

  // afterDestroy: function(gameRoom, cb) {
  //   sails.sockets.broadcast('lobby', 'removeGameRoom', gameRoom);
  //   console.log("Sent removeGameRoom to lobby");
  //   cb();
  // }

};

