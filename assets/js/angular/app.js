angular.module('hGApp', ['sails.io', 'ngCookies', 'ngAnimate', 'ui.bootstrap'])
.config(['$locationProvider', function($locationProvider) {
  $locationProvider.html5Mode({
    enabled: true,
    requireBase: false
  });
}])
.service('UserService', function($cookies, $sailsSocket, $window) {

  this.username = "";

  this.getUsername = function() {
    if (this.username == "")
    var oldUsername = $cookies.getObject('username') || null;
    if (oldUsername != null) {
      this.username = oldUsername;
    }
    return this.username;
  }

  this.setUsername = function(username) {
    this.username = username;
    $cookies.putObject('username', this.username);
  }

  this.createPlayerInRoom = function(username, gameRoomId, callback) {
    var newPlayer = {name : username, inGameRoom: gameRoomId};
    $sailsSocket.post('/player/create', newPlayer)
    .success(function (response) {
      callback(gameRoomId);
    })
    .error(function (response) {
      console.log(response);
    });
  };

})
.service('GameRoomService', function($sailsSocket, UserService) {
  this.newCreatedGameRoom;
})
.controller('HeaderCtrl', function($http, $log, $rootScope, $scope, $sailsSocket, $cookies, $uibModal, $location, UserService, GameRoomService) {

  $scope.username = UserService.getUsername();
  $scope.joinRoomAtCreate = false;
  $scope.newGameRoomName = "";
  $scope.notInGame = false;

  $scope.$watch(function() {
    return UserService.username;
  }, function(newVal, oldVal) {
    if (newVal) {
      $scope.username = newVal;
    }
  }, true);

  $scope.createNewGameRoom = function() {
    $sailsSocket.post('/gameroom/create', {name: $scope.newGameRoomName})
    .success(function (response) {
      if ($scope.joinRoomAtCreate) {
        GameRoomService.joinRoom(response.id);
        return;
      }
      response.players = [];
      GameRoomService.newCreatedGameRoom = response;
      $scope.newGameRoomName = "";
    })
    .error(function (response) {
      console.log(response);
    });
  };

  $scope.openUsernameModal = function (size, callback) {

    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'usernameModal',
      controller: 'ModalInstanceCtrl',
      size: size,
      resolve: {
        username: function () {
          return $scope.username;
        }
      }
    });

    modalInstance.result.then(function (username) {
      if (username.length > 1) {
        UserService.setUsername(username);
        if (callback) {
          callback();
        }
        return username;
      }
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

  if ($location.path().indexOf("game/") == -1) {
    $scope.notInGame = true;
  } 

})
.controller('LobbyCtrl', function($http, $log, $rootScope, $scope, $sailsSocket, $window, $uibModal, $cookies, UserService, GameRoomService) {

  // variable declarations

  $scope.predicate = '-id';
  $scope.reverse = false;
  $scope.gameRoomList = [];
  var disconnected = false;

  // function declarations

  getGameRooms = function() {
    $sailsSocket.get('/gameroom?active=false')
    .success(function (response) {
      $scope.gameRoomList = response;
    })
    .error(function (response) {
      console.log(response);
    });
  }; 

  redirectToRoom = function(gameRoomId) {
    $window.location.href = 'game/'+gameRoomId;
  }

  $scope.joinRoom = function(id) {
    username = UserService.getUsername();
    if (username == "") {
      $scope.openUsernameModal('md', function() { UserService.createPlayerInRoom(UserService.username, id, redirectToRoom(id)) });
    } else {
      UserService.createPlayerInRoom(UserService.username, id, redirectToRoom(id));
    }
  };

  $scope.openUsernameModal = function (size, callback) {

    var modalInstance = $uibModal.open({
      animation: true,
      templateUrl: 'usernameModal',
      controller: 'ModalInstanceCtrl',
      size: size,
      resolve: {
        username: function () {
          return UserService.getUsername();
        }
      }
    });

    modalInstance.result.then(function (username) {
      if (username.length > 1) {
        UserService.setUsername(username);
        if (callback) {
          callback();
        }
        return username;
      }
    }, function () {
      $log.info('Modal dismissed at: ' + new Date());
    });
  };

  // code to run

  window.onload = function () {
    // oldUsername = $cookies.getObject('username') || null;
    // if (oldUsername != null) {
    //   $scope.username = oldUsername;
    // }
    getGameRooms();
    // console.log($scope.gameRoomList);
  }

  $scope.$watch(function() {
    return GameRoomService.newCreatedGameRoom;
  }, function(newVal, oldVal) {
    if (newVal) {
      $scope.gameRoomList.push(newVal);
    }
  }, true);


  $sailsSocket.subscribe('connect', function() {
    if (disconnected) {
      getGameRooms();
      disconnected = false;
    }
  });

  $sailsSocket.subscribe('disconnect', function() {
    disconnected = true;
  })

  $sailsSocket.subscribe('gameroom', function (message) {
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
        $sailsSocket.get('/player/'+message.addedId)
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

  

})
.controller('GameRoomCtrl', function($http, $log, $scope, $sailsSocket, $location, $cookies, $interval, $uibModal) {
  $scope.test = "HEJ";
  $scope.gameRoom = null;
  $scope.player = null;
  $scope.username == "";
  $scope.hasUsername = false;
  $scope.waitingToStart = false;
  $scope.gameActive = false;
  $scope.tweetText = "No tweet";
  $scope.playerReady = false;
  $scope.gameWinners = [];
  var href = $location.path()
  var gameRoomId = href.substring(href.lastIndexOf('/')+1);
  var socketId = "";
  $scope.countdownToStart = 0;
  var countdownObject = null;

  // $scope.createPlayer = function() {
  //   var newPlayer = {name : $scope.username, guess: $scope.guess, inGameRoom: $scope.gameRoom.id, socketId: socketId};
  //   $sailsSocket.post('/player/create', newPlayer)
  //   .success(function (response) {
  //     $scope.gameRoom.players.push(response);
  //     $scope.player = response;
  //     $scope.guess = $scope.player.guess;
  //     $cookies.putObject('player', $scope.player);
  //     $scope.hasUsername = true;
  //     if ($scope.gameRoom.destroyIfEmpty == false) {
  //       $sailsSocket.post('/gameroom/update/'+$scope.gameRoom.id, {destroyIfEmpty: true})
  //       .success(function updateCB(response) {
  //         $scope.gameRoom = response;
  //       })
  //       .error(function (response) {
  //         console.log(response);
  //       });
  //     }
  //   })
  //   .error(function (response) {
  //     console.log(response);
  //   });
  // };

  $scope.ready = function() {
    // $scope.player.guess = "#"+$scope.guess;
    $sailsSocket.get('/game/ready/'+$scope.gameRoom.id+'/'+$scope.player.guess)
    .success(function (response) {
    })
    .error(function (response) {
      console.log("Error while readying");
      console.log(response);
    });
    $scope.playerReady = true;
  }

  window.onload = function () {
    // oldUsername = $cookies.getObject('username') || null;
    // if (oldUsername != null) {
    //   $scope.username = oldUsername;
    // }
    $sailsSocket.get('/game/init/'+gameRoomId)
      .success(function (response) {
        console.log("test");
        if (!response.gameRoom.players) {
          response.gameRom.players = []
        }
        // if (response.playerId) {
        //   for (i = 0; i < response.gameRoom.players.length; i++) {
        //     if (response.gameRoom.players[i].id == response.playerId) {
        //       $scope.player = response.gameRoom.players[i];
        //       console.log($scope.player.id);
        //     }
        //   }
        // }
        $scope.gameRoom = response.gameRoom;
        $scope.player = response.player;
      })
      .error(function (response) {
        console.log(response);
      });
  };

  $sailsSocket.subscribe('countdownToStart', function(data) {
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

  $sailsSocket.subscribe('gameStarted', function () {
    $scope.waitingToStart = false;
    $scope.gameActive = true;
  });

  $sailsSocket.subscribe('newTweet', function (data) {
    for (var i in data.players) {
      var player = $scope.gameRoom.players.filter(function (element) {
        return element.id == data.players[i]
      })[0];
      player.score++;
      player.latestTweet = data.tweet.text;
    }
  });

  $sailsSocket.subscribe('gameOver', function (data) {
    console.log("gameOver");
    console.log(data);
    $scope.gameWinners = data.winners;
  });

  $sailsSocket.subscribe('gameroom', function (message) {
    if (message.verb == "addedTo") {
      if (message.attribute == "players") {
        $sailsSocket.get('/player/'+message.addedId).success(function (response) {
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
})
.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, username) {

  $scope.username = username;

  $scope.ok = function () {
    $uibModalInstance.close($scope.username);
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };
});