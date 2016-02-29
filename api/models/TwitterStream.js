/**
* TwitterStream.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var clone = require('clone');

var TwitterObject = null;
var currentStream = null;
var timerInterval = 30000;
var activeHashtags = {};
var waitingHashtags= {};
var removesToExecute = [];
var latestStartTime = 0;
var timerObject = null;

var timerFunc = function () {
  if (Object.keys(waitingHashtags).length > 0) {
    var oldStream = currentStream;
    activeHashtags = clone(waitingHashtags);
    currentStream = TwitterObject.stream('statuses/filter', {track: Object.keys(activeHashtags)});

    currentStream.on('tweet', function (tweet) {
      if (!tweet.retweeted) {
        hashtags = tweet.entities.hashtags;
        for (var hashtagI in hashtags) {
          // console.log(hashtags[hashtagI].text);
          var gameRooms = activeHashtags["#"+hashtags[hashtagI].text]
          for (var gameRoom in gameRooms) {
            Player.find(gameRooms[gameRoom].players).exec(function findCB(err, found) {
              for (var i = 0; i < found.length; i++) {
                Player.update(found[i].id,{score: found[i].score+1}).exec(function (err, updated) {
                });
              }
            });
            sails.sockets.broadcast('gameRoom'+gameRoom, 'newTweet', {players: gameRooms[gameRoom].players, tweet: tweet});
          }
        }
      }
    });
    currentStream.on('limit', function (msg) {
      console.log("Limit: ");
      console.log(msg);
    });
    currentStream.on('disconnect', function (msg) {
      console.log("Disconnect: " + msg);
    });
    currentStream.on('connect', function (request) {
      console.log("Connect:");
      // console.log(request);
    });
    currentStream.on('connected', function (response) {
      console.log("Connected:")
      if (oldStream) {
        oldStream.stop();
        oldStream = null;
      }
      latestStartTime = Date.now();
      console.log(Object.keys(activeHashtags));
      sails.sockets.broadcast('waitingGameRooms', 'gameStarted', null);
      // do remove hashtags timer
      removesToExecute.forEach(function (o, i, a) {
        setTimeout(o.func, o.gameTime, o.hashtags, o.gameRoomId);
      });
      removesToExecute = []
      timerObject = setTimeout(timerFunc, timerInterval);
    });
    currentStream.on('warning', function (warning) {
      console.log("Warning: " + warning);
    });
    currentStream.on('reconnect', function (request, response, connectInterval) {
      console.log("Reconnect:" + connectInterval);
      // console.log(request);
      // console.log(response);
      // console.log(connectInterval);
    });
    // console.log(Date.now()-latestStartTime);
  }
}

module.exports = {

  init: function() {
    var Twit = require('twit');
    var twitterKeys = sails.config.twitterKeys;
    TwitterObject = new Twit({
      consumer_key: twitterKeys.consumer_key,
      consumer_secret: twitterKeys.consumer_secret,
      access_token: twitterKeys.access_token,
      access_token_secret: twitterKeys.access_token_secret
    });
  },

  track: function(gameRoom) {
    var hashtags = [];
    gameRoom.players.forEach(function (o, i, a) {
      console.log("Adding hashtag " + o.guess + " for gameroom " + gameRoom.id + " for player " + o.name);
      var currentGameRoomsForGuess = waitingHashtags[o.guess];
      if (currentGameRoomsForGuess) {
        if (currentGameRoomsForGuess[gameRoom.id]) {
          currentGameRoomsForGuess[gameRoom.id].players.push(o.id);
        } else {
          currentGameRoomsForGuess[gameRoom.id] = {players: [o.id]};
        }
      } else {
        waitingHashtags[o.guess] = {};
        waitingHashtags[o.guess][gameRoom.id] = {players: [o.id]}
      }
      hashtags.push(o.guess);
    });
    // console.log(JSON.stringify(activeHashtags, null, 4));
    removesToExecute.push({func: function (hashtagsToRemove, gameRoomIdToRemove) {
      Player.find().where({inGameRoom: gameRoomIdToRemove}).exec(function (err, found) {
        if (found.length > 0) {
          highestScoringPlayers = [];
          for (var i in found) {
            if (highestScoringPlayers.length > 0) {
              if (found[i].score > highestScoringPlayers[0].score) {
                console.log("Replacing winner with " + found[i].name);
                highestScoringPlayers[0] = found[i];
              } else if (found[i].score === highestScoringPlayers[0].score) {
                console.log("Adding " + found[i].name + " to winners");
                highestScoringPlayers.push(found[i]);
              }
            } else {
              console.log("Setting " + found[i].name + " as winner");
              highestScoringPlayers.push(found[i]);
            }
          }
          console.log(highestScoringPlayers);
          var socketRoom = 'gameRoom'+gameRoomIdToRemove;
          console.log("sending to socketroom " + socketRoom);
          sails.sockets.broadcast(socketRoom, 'gameOver', {winners: highestScoringPlayers});
        }
      });
      hashtagsToRemove.forEach(function (o, i, a) {
        console.log("Removing hashtag " + o + " for gameroom " + gameRoomIdToRemove);
        gameRooms = waitingHashtags[o];
        if (Object.keys(gameRooms).length > 1) {
          for (var key in gameRooms) {
            if (key == gameRoomIdToRemove) {
              delete gameRooms[key];
            }
          }
        } else {
          delete waitingHashtags[o];
        }
      });
      if (Object.keys(waitingHashtags).length == 0) {
        console.log("Killing connection");
        currentStream.stop();
        currentStream = null;
        clearTimeout(timerObject);
        timerObject = null;
      }
    }, gameTime: gameRoom.gameTime, hashtags: hashtags, gameRoomId: gameRoom.id});
    if (!timerObject) timerFunc();
    return {latestStartTime: latestStartTime, interval: timerInterval};
  },

  attributes: {

  }
};

