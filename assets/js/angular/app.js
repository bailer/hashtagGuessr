angular.module('hGApp', ['ngSails', 'ngCookies'])
.controller('LobbyCtrl', ['$http', '$log', '$scope', '$sails', '$window', function($http, $log, $scope, $sails, $window) {

  // variable declarations

  $scope.predicate = '-id';
  $scope.reverse = false;
  $scope.gameRoomList = {};
  $scope.newGameRoomName = "";
  $scope.joinRoomAtCreate = true;

  // function declarations

  $scope.getGameRooms = function() {
    $sails.get('/gameroom/getOpenGameRooms').success(function (response) {
      $scope.gameRoomList = response;
    });
  };

  $scope.createNewGameRoom = function() {
    $sails.post('/gameroom/create', {name: $scope.newGameRoomName}).success(function (response) {
      if ($scope.joinRoomAtCreate) { 
        $window.location.href = '/game/'+response.id;
        return;
      }
      response.players = [];
      $scope.gameRoomList.push(response);
      $scope.newGameRoomName = "";
    });
  };

  // code to run

  $sails.on('connect', function() {
    $scope.getGameRooms();
  });

  $sails.on('gameroom', function (message) {
    if (message.verb == "created") {
      console.log("created!");
      $scope.gameRoomList.push(message.data);
    } else if (message.verb == "destroyed") {
      console.log("destroyed!");
      angular.forEach($scope.gameRoomList, function(obj, index) {
        if (message.previous.id === obj.id) {
          $scope.gameRoomList.splice(index, 1);
          return;
        }
      });
    } else if (message.verb == "updated") {
      console.log("update!");
      if (message.data.active == true) {
        angular.forEach($scope.gameRoomList, function(obj, index) {
          if (message.id === obj.id) {
            $scope.gameRoomList.splice(index, 1);
            return;
          }
        });
      }
    } else if (message.verb == "addedTo") {
      console.log("addedTo");
      if (message.attribute == "players") {
        $sails.get('/player/'+message.addedId).success(function (response) {
          var gameRoom = $scope.gameRoomList.filter(function (element) {
            return element.id === message.id
          })[0];
          gameRoom.players.push(response);
        });
      }
    } else if (message.verb == "removedFrom") {
      console.log("removedFrom");
      if (message.attribute == "players") {
        var gameRoom = $scope.gameRoomList.filter(function (element) {
            return element.id === message.id
        })[0];
        if (message.attribute == "players") {
          angular.forEach(gameRoom.players, function(obj, index) {
            if (message.removedId == obj.id) {
              gameRoom.players.splice(index, 1);
              return;
            }
          });
        }
      }
    } else {
      console.log("other message: " + message.verb);
    }
  });

}])
.controller('GameRoomCtrl', ['$http', '$log', '$scope', '$sails', '$location', '$cookies', '$interval', function($http, $log, $scope, $sails, $location, $cookies, $interval) {

  $scope.gameRoom = null;
  $scope.player = null;
  $scope.username == "";
  $scope.hasUsername = false;
  $scope.guess = "";
  $scope.waitingToStart = false;
  $scope.gameActive = false;
  $scope.tweetText = "No tweet";
  var gameRoomId = $(location).attr('pathname').substring(6,7);
  var socketId = "";
  $scope.countdownToStart = 0;
  var countdownObject = null;
  

  $scope.joinRoom = function() {
    var newPlayer = {name : $scope.username, guess: $scope.guess, inGameRoom: $scope.gameRoom.id, socketId: socketId};
    $sails.post('/player/create', newPlayer).success(function (response) {
      $scope.gameRoom.players.push(response);
      $scope.player = response;
      $scope.guess = $scope.player.guess;
      $cookies.putObject('player', $scope.player);
      $scope.hasUsername = true;
      if ($scope.gameRoom.destroyIfEmpty == false) {
        $sails.post('/gameroom/update/'+$scope.gameRoom.id, {destroyIfEmpty: true}).success(function updateCB(response) {
          $scope.gameRoom = response;
        })
      }
    });
  };

  $scope.startGame = function() {
    $sails.get('/game/start/'+$scope.gameRoom.id).success(function (response) {
      console.log(response);
      console.log(Date.now());
      $scope.countdownToStart = Math.round((response.interval-(Date.now()-response.latestStartTime))/1000);
      $scope.waitingToStart = true;
      countdownObject = $interval(function () {
        if ($scope.countdownToStart > 0) {
          console.log("tick");
          $scope.countdownToStart--;
        } else {
          $interval.cancel(countdownObject);
        }
      }, 1000);
    });
  }

  onload = function () {
    oldPlayer = $cookies.getObject('player') || null;
    if (oldPlayer != null) {
      $scope.username = oldPlayer.name;
      // if (oldPlayer.inGameRoom.id == gameRoomId) {
      //   $scope.hasUsername = true;
      // }
    }
  };

  $sails.on('gameStarted', function () {
    $scope.waitingToStart = false;
    $scope.gameActive = true;
  });

  $sails.on('newTweet', function(data) {
    $scope.player.score++;
    $scope.tweetText = data.text;
  });

  $sails.on('connect', function() {
    $sails.get('/game/init/'+gameRoomId).success(function (response) {
      if (!response.players) {
        response.players = []
      }
      $scope.gameRoom = response.gameRoom;
      socketId = response.socketId;
    });
  });

  $sails.on('gameroom', function (message) {
    if (message.verb == "addedTo") {
      if (message.attribute == "players") {
        $sails.get('/player/'+message.addedId).success(function (response) {
          $scope.gameRoom.players.push(response);
        });
      }
    } else if (message.verb == "removedFrom") {
      if (message.attribute == "players") {
        angular.forEach($scope.gameRoom.players, function(obj, index) {
          console.log(obj);
          if (message.removedId == obj.id) {
            console.log("found it")
            $scope.gameRoom.players.splice(index, 1);
            return;
          }
        });
      }
    }
  });
}]);