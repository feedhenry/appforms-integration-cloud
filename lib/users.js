var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var _ = require('underscore');
/**
 * Including fh-mbaas-api to be able to use $fh.db to store and retrieve jobs
 */
var fh = require('fh-mbaas-api');


function userRoute() {
  var userRouter = new express.Router();
  userRouter.use(cors());
  userRouter.use(bodyParser());


  function handleError(err, response){
    var error = {
      "message": err,
      "code": 500
    };
    response.writeHead(500);
    response.end(JSON.stringify(error));
  }

  /**
   * Finding a list of jobs located in mongo database
   */
  function findUserEntry(userId, cb){
    fh.db({
      act: "list",
      type: "users",
      eq: {
        userId: userId
      }
    }, cb);
  }

  /**
   * Logging in as a user
   */
  userRouter.get('/:userId', function(req, res) {

    var reqParams = req.params;
    var userName = reqParams.userId;

    findUserEntry(userName, function(err, listResult){
      if(err){
        handleError(err, res);
      } else {
        if(listResult.count === 1){
          var user = listResult.list[0].fields;
          res.json(user);
        } else {
          handleError("No user found matching id " + userName, res);
        }
      }
    });
  });

  return userRouter;
}

module.exports = userRoute;