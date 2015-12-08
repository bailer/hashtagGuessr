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
      required: true,
      minLength: 3,
      maxLength: 20
      // unique: true
    },
    password: {
      type: 'string',
      minLength: 3,
      maxLength: 20
    },
    players: {
      maxLength: 4,
      collection: 'Player',
      via: 'inGameRoom',
    },
    gameTime: {
      type: 'integer',
      defaultsTo: 60000,
      min: 10000,
      max: 300000
    },
    active: {
      type: 'boolean',
      defaultsTo: 'false'
    },
    destroyIfEmpty: {
      type: 'boolean',
      defaultsTo: 'false'
    }
  },
};

