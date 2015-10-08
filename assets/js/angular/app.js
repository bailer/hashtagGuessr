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
    $sails.get('/gameroom').success(function (response) {
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
      console.log("mupp");
    }
  });

}])
.controller('GameRoomCtrl', ['$http', '$log', '$scope', '$sails', '$location', '$cookies', function($http, $log, $scope, $sails, $location, $cookies) {

  $scope.gameRoom = null;
  $scope.username == "";
  $scope.hasUsername = false;
  $scope.guess = "";
  gameRoomId = $(location).attr('pathname').substring(6,7);

  $scope.setUsername = function() {
    $sails.post('/player/create', {name : $scope.username, inGameRoom: $scope.gameRoom.id}).success(function (response) {
      $scope.gameRoom.players.push(response);
      $cookies.put('username', $scope.username);
      $cookies.put('inGameRoom', $scope.gameRoom.id);
      console.log($cookies.get('username'));
      console.log($cookies.get('inGameRoom'));
      $scope.hasUsername = true;
    });
  };

  onload = function () {
    console.log($cookies.get('username'));
    console.log($cookies.get('inGameRoom'));
    username = $cookies.get('username') || "";
    if (username) {
      $scope.username = username;
      cookieRoom = $cookies.get('inGameRoom');
      if (cookieRoom == gameRoomId) {
        $scope.hasUsername = true;
      }
    }
  }

  $sails.on('connect', function() {
    $sails.get('/gameroom/'+gameRoomId).success(function (response) {
      $scope.gameRoom = response;
      $sails.get('/socket').success(function (response) {
        console.log("Socket " + response.socketId);
        console.log($cookies.getObject('sails.sid'));
      });
      if (!$scope.hasUsername) {

      }
    });
  });

  // $sails.get('/gameroom').success(function (response) {});

  $sails.on('gameroom', function (message) {
    if (message.verb == "addedTo") {
      if (message.attribute == "players") {
        $scope.gameRoom.players.push(message.addedId);
      }
    }
  })

}]);