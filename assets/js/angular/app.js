angular.module('hGApp', ['ngSails', 'ngCookies'])
.controller('LobbyCtrl', ['$http', '$log', '$scope', '$sails', '$window', function($http, $log, $scope, $sails, $window) {

  // variable declarations

  $scope.predicate = '-id';
  $scope.reverse = false;
  $scope.gameRoomList =[];
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
      $scope.gameRoomList.push(message.data);
    } else if (message.verb == "destroyed") {
      angular.forEach($scope.gameRoomList, function(obj, index) {
        if (message.previous.id === obj.id) {
          $scope.gameRoomList.splice(index, 1);
          return;
        }
      });
    } else if (message.verb == "updated") {
      if (message.data.active == true) {
        angular.forEach($scope.gameRoomList, function(obj, index) {
          if (message.id === obj.id) {
            $scope.gameRoomList.splice(index, 1);
            return;
          }
        });
      }
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
  gameRoomId = $(location).attr('pathname').substring(6,7);
  socketId = "";
  $scope.countdownToStart = 0;
  countdownObject = null;
  

  $scope.joinRoom = function() {
    if ($scope.player) {
      $sails.post('/player/update/'+$scope.player.id, {name: $scope.username, guess: $scope.guess}).success(function (response) {
        $scope.player = response;
        $scope.guess = $scope.player.guess;
        $scope.gameRoom.players[0].name = $scope.player.name;
        $cookies.putObject('player', $scope.player);
        $scope.hasUsername = true;
      });
    } else {
      $sails.post('/player/create', {name : $scope.username, guess: $scope.guess, inGameRoom: $scope.gameRoom.id, socketId: socketId}).success(function (response) {
        $scope.gameRoom.players.push(response);
        $scope.player = response;
        $scope.guess = $scope.player.guess;
        $cookies.putObject('player', $scope.player);
        $scope.hasUsername = true;
      });
    }
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
      $scope.gameRoom = response.gameRoom;
      socketId = response.socketId;
      if ($scope.gameRoom.players.length == 1) {
        if ($scope.gameRoom.players[0].socketId == socketId) {
          $scope.player = $scope.gameRoom.players[0];
        }
      }
    });
    // $sails.get('/gameroom');
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