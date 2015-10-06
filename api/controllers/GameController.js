/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

 module.exports = {
  startGame: function(req, res) {
    return res.render('index', { 
      test: 'Game time!' 
    });
  }
};

