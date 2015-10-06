var hashtagGuessrApp = angular.module('hashtagGuessrApp', []);

hashtagGuessrApp.controller('LobbyController', ['$http', '$log', '$scope', function($http, $log, $scope) {

  $scope.predicate = '-id';
  $scope.reverse = false;
  $scope.gameRoomList =[];

  $scope.getGameRooms = function() {
    io.socket.get('/gameroom', function serverResponded(body, JWR) {
      console.log("hmm")
      $scope.gameRoomList = body;
      $scope.$apply();
    });
  };

  $scope.getGameRooms();
  $scope.newGameRoomName = "";

  $scope.createNewGameRoom = function() {
    io.socket.post('/gameroom/create', {name: $scope.newGameRoomName}, function(resData, jwres) {
      if (jwres.statusCode == 201) {
        $scope.gameRoomList.push(resData);
        $scope.newGameRoomName = "";
        $scope.$apply();
      }
    });
  };

  io.socket.on('gameroom', function(obj) {
    if (obj.verb == "created") {
      console.log("ID: " + obj.id + ", data: " + obj.data);
      console.log(obj.data);
      $scope.gameRoomList.push(obj.data);
      $scope.$apply();
    } else if (obj.verb = "destroyed") {
       $scope.gameRoomList.splice(obj.id,1);
       $scope.$apply();
    }
  });
}]);