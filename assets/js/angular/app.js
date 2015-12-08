angular.module('hGApp', ['ngSails', 'ngCookies'])
.controller('LobbyCtrl', ['$http', '$log', '$scope', '$sails', '$window', function($http, $log, $scope, $sails, $window) {

  // variable declarations

  $scope.predicate = '-id';
  $scope.reverse = false;
  $scope.gameRoomList = [];
  $scope.newGameRoomName = "";
  $scope.joinRoomAtCreate = false;
  var disconnected = false;

  // function declarations

  getGameRooms = function() {
    $sails.get('/gameroom?active=false')
    .success(function (response) {
      $scope.gameRoomList = response;
    })
    .error(function (response) {
      console.log(response);
    });
  };

  $scope.createNewGameRoom = function() {
    $sails.post('/gameroom/create', {name: $scope.newGameRoomName})
    .success(function (response) {
      if ($scope.joinRoomAtCreate) { 
        $window.location.href = '/game/'+response.id;
        return;
      }
      response.players = [];
      $scope.gameRoomList.push(response);
      $scope.newGameRoomName = "";
    })
    .error(function (response) {
      console.log(response);
    });
  };

  // code to run

  window.onload = function () {
    getGameRooms();
  }

  $sails.on('connect', function() {
    if (disconnected) {
      getGameRooms();
      disconnected = false;
    }
  });

  $sails.on('disconnect', function() {
    disconnected = true;
  })

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
        $sails.get('/player/'+message.addedId)
        .success(function (response) {
          var gameRoom = $scope.gameRoomList.filter(function (element) {
            return element.id === message.id
          })[0];
          gameRoom.players.push(response);
        })
        .error(function (response) {
          console.log(response);
        });
      }
    } else if (message.verb == "removedFrom") {
      console.log("removedFrom");
      if (message.attribute == "players") {
        var gameRoom = $scope.gameRoomList.filter(function (element) {
            return element.id === message.id
        })[0];
        angular.forEach(gameRoom.players, function(obj, index) {
          if (message.removedId == obj.id) {
            gameRoom.players.splice(index, 1);
            return;
          }
        });
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
  $scope.playerReady = false;
  var href = $(location).attr('pathname')
  var gameRoomId = href.substring(href.lastIndexOf('/')+1);
  var socketId = "";
  $scope.countdownToStart = 0;
  var countdownObject = null;

  $scope.joinRoom = function() {
    var newPlayer = {name : $scope.username, guess: $scope.guess, inGameRoom: $scope.gameRoom.id, socketId: socketId};
    $sails.post('/player/create', newPlayer)
    .success(function (response) {
      $scope.gameRoom.players.push(response);
      $scope.player = response;
      $scope.guess = $scope.player.guess;
      $cookies.putObject('player', $scope.player);
      $scope.hasUsername = true;
      if ($scope.gameRoom.destroyIfEmpty == false) {
        $sails.post('/gameroom/update/'+$scope.gameRoom.id, {destroyIfEmpty: true})
        .success(function updateCB(response) {
          $scope.gameRoom = response;
        })
        .error(function (response) {
          console.log(response);
        });
      }
    })
    .error(function (response) {
      console.log(response);
    });
  };

  $scope.ready = function() {
    $sails.get('/game/ready/'+$scope.gameRoom.id+'/'+$scope.player.id+'/'+socketId)
    .success(function (response) {
    })
    .error(function (response) {
      console.log(response);
    });
    $scope.playerReady = true;
  }

  window.onload = function () {
    oldPlayer = $cookies.getObject('player') || null;
    if (oldPlayer != null) {
      $scope.username = oldPlayer.name;
    }
    $sails.get('/game/init/'+gameRoomId)
      .success(function (response) {
        if (!response.players) {
          response.players = []
        }
        $scope.gameRoom = response.gameRoom;
        socketId = response.socketId;
      })
      .error(function (response) {
        console.log(response);
      });
  };

  $sails.on('countdownToStart', function(data) {
    console.log(Date.now());
    $scope.countdownToStart = Math.round((data.interval-(Date.now()-data.latestStartTime))/1000);
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

  $sails.on('gameStarted', function () {
    $scope.waitingToStart = false;
    $scope.gameActive = true;
  });

  $sails.on('newTweet', function(data) {
    $scope.player.score++;
    $scope.tweetText = data.text;
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