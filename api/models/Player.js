/**
* Player.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var MinLength = 2;
var MaxLength = 20;
var lengtMessage = 'Must be at least ' + MinLength + ' characters but no longer than ' + MaxLength;

module.exports = {

  beforeValidate: function (values, cb) {
    if (values.inGameRoom) {
      GameRoom.findOne(values.inGameRoom).populateAll().exec(function CB(err, found) {
        if (found) {
          values.gameRoomToJoin = found;
        } else {
          values.gameRoomToJoin = undefined;
        }
        cb();
      });
    } else {
      cb();
    }
  },

  afterValidate: function (values, cb) {
    if (values.gameRoomToJoin) {
      delete values.gameRoomToJoin
    }
    if (values.guess) {
      values.guess = "#"+values.guess;
    }
    cb();
  },

  types: {
    exist: function () {
      if (this.gameRoomToJoin) {
        return true;
      } else {
        return false;
      }
    },
    notFull: function() {
      if (this.gameRoomToJoin.players.length < 4) {
        return true;
      } else {
        return false;
      }
    },
    notStarted: function() {
      return !this.gameRoomToJoin.active;
    }
  },

  attributes: {
    name: {
      type: 'string',
      minLength: MinLength,
      maxLength: MaxLength,
      unique: true,
      required: true,
    },
    guess: {
      type: 'string',
      minLength: MinLength,
      maxLength: MaxLength,
      required: false,
    },
    inGameRoom: {
      model: 'GameRoom',
      required: false,
      exist: true,
      notFull: true,
      notStarted: true,
    },
    socketId: {
      type: 'string'
    },
    score: {
      type: 'integer',
      defaultsTo: 0
    },
    ready: {
      type: 'boolean',
      defaultsTo: false,
    }
  },

  validationMessages: {
    name: {
      minLength: lengtMessage,
      maxLength: lengtMessage,
      unique: "That username is currently not available",
      required: "Please provide a name"
    },
    guess: {
      minLength: lengtMessage,
      maxLength: lengtMessage,
      required: "Please provide a guess"
    },
    inGameRoom: {
      required: "Have to join a specific gameroom",
      exist: "The room you want to join doesn't exist",
      notFull: "The room you want to join is full",
      notStarted: "The room you want to join has already started",
    }
  }
};

