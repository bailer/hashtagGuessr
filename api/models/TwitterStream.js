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
  if (removesToExecute.length > 0) {
    var oldStream = currentStream;
    activeHashtags = clone(waitingHashtags);
    currentStream = TwitterObject.stream('statuses/filter', {track: Object.keys(activeHashtags)});

    currentStream.on('tweet', function (tweet) {
      if (!tweet.retweeted) {
        var gameRoomsToPing = [];
        for (var oKey in activeHashtags) {
          for (var iKey in tweet.entities.hashtags) {
            if (oKey === '#' + tweet.entities.hashtags[iKey].text) {
              activeHashtags[oKey].forEach(function (o, i, a) {
                gameRoomsToPing[o] = o;
              });
              break;
            }
          }
        }
        gameRoomsToPing.forEach(function (o, i, a) {
          console.log("Pinging: " + o);
          sails.sockets.broadcast('gameRoom'+o, 'newTweet', tweet);
        });
        // console.log(tweet.text);
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
        removesToExecute.splice(i, 1);
      });
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
    console.log(Date.now()-latestStartTime);
  }
}

module.exports = {

  init: function() {
    var Twit = require('twit');
    TwitterObject = new Twit({
      consumer_key: 'kdeBpqxzD6nAEZpFHeHHuCnsP',
      consumer_secret: 'ehHuPwiXMILp0Dn1fZGuLMHxXeJxoxk7L9LvbKdh0PnmcIqdZW',
      access_token: '123103860-8vgX1aD3xAS4UsUsVqIZoL8KqJGrwPeeeOf3ZJOd',
      access_token_secret: 'mpZ9trTtgzuuAA6MCw4AJOMCwGFdWoerzyWNp1V03fDEx'
    });
  },

  track: function(gameRoom, res) {
    if (!timerObject) {
      // timerObject = setTimeout(timerFunc, timerInterval);
      // latestStartTime = Date.now();
    }
    var hashtags = [];
    gameRoom.players.forEach(function (o, i, a) {
      console.log("Adding hashtag " + o.guess + " for gameroom " + gameRoom.id);  
      var currentGameRooms = waitingHashtags[o.guess];
      if (currentGameRooms) {
        currentGameRooms.push(gameRoom.id);
      } else {
        waitingHashtags[o.guess] = [gameRoom.id];
      }
      hashtags.push(o.guess);
    });
    // console.log(JSON.stringify(activeHashtags, null, 4));
    removesToExecute.push({func: function (hashtagsToRemove, gameRoomIdToRemove) {
      hashtagsToRemove.forEach(function (o, i, a) {
        console.log("Removing hashtag " + o + " for gameroom " + gameRoomIdToRemove);
        gameRooms = waitingHashtags[o];
        if (gameRooms.length > 1) {
          for (var key in gameRooms) {
            if (gameRooms[key] === gameRoomIdToRemove) {
              gameRooms.splice(i, 1);
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

