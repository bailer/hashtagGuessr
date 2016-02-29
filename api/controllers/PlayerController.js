/**
 * PlayerController
 *
 * @description :: Server-side logic for managing Players
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  create: function (req, res) {
    Player.create(req.body).exec(function created (err, newInstance) {
      if (err) return res.negotiate(err);
      if (req.isSocket) {
        Player.subscribe(req, newInstance);
        Player.introduce(newInstance);
      }
      Player.publishCreate(newInstance, !req.options.mirror && req);
      console.log("in user create, session id: " + req.session.id);
      console.log("in user create, newinstanceID " + newInstance.id);
      req.session.userId = newInstance.id;
      console.log("in user create, User session id: " + req.session.userId);
      res.created(newInstance);
    });
  }
	
};

