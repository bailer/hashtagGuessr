/**
* Player.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    name: {
      type: 'string',
    },
    guess: {
      type: 'string',
      defaultsTo: '#nohashtag'
    },
    inGameRoom: {
      model: 'GameRoom'
    },
    socketId: {
      type: 'string'
    },
    score: {
      type: 'integer',
      defaultsTo: 0
    }
  }
};

