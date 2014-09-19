var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var _ = require('underscore');
/**
 * Including fh-mbaas-api to be able to use $fh.db to store and retrieve jobs
 */
var fh = require('fh-mbaas-api');

fh.db({
  act: "deleteall",
  type: "jobs"
}, function(err){
  console.log("Delete  Done", err);
});



function jobRoute() {
  var jobsRouter = new express.Router();
  jobsRouter.use(cors());
  jobsRouter.use(bodyParser());


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
  function findJobEntry(jobId, cb){
    fh.db({
      act: "list",
      type: "jobs",
      eq: {
        jobId: jobId
      }
    }, cb);
  }

  /**
   * Getting a list of jobs from the server.
   */
  jobsRouter.get('/', function(req, res) {
    /**
     * Finding a list of jobs located in mongo database
     */
    fh.db({
      act: "list",
      type: "jobs"
    }, function(err, listResult){
      if(err){
        handleError(err, res);
      } else {
        var jobs = _.map(listResult.list, function(jobEntry){
          return jobEntry.fields;
        });
        res.json(jobs);
      }
    });
  });

  /**
   * Getting a specific job by its id
   */
  jobsRouter.get('/:jobId', function(req, res) {

    var reqParams = req.params;
    var jobId = reqParams.jobId;

    findJobEntry(jobId, function(err, listResult){
      if(err){
        handleError(err, res);
      } else {
        if(listResult.count === 1){
          var job = listResult.list[0].fields;
          res.json(job);
        } else {
          handleError("No job found matching id " + jobId, res);
        }
      }
    });
  });

  /**
   * Creating a new job
   */
  jobsRouter.post('/', function(req, res) {

    var jobDetails = req.body;

    fh.db({
      act: "create",
      type: "jobs",
      fields: jobDetails
    }, function(err, data){
      if(err){
        handleError(err, res);
      } else {
        var jobData = data.fields;
        res.json(jobData);
      }
    });
  });

  /**
   * Updating job details using a put request.
   */
  jobsRouter.put('/:jobId', function(req, res) {
    var reqParams = req.params;
    var jobId = reqParams.jobId;
    var jobData = req.body;

    console.log("reqParams", reqParams, jobData);

    /**
     * Finding a job with jobId
     */
    findJobEntry(jobId, function(err, listResult){
      console.log("Found Job", err, listResult);
      if(err){
        handleError(err, res);
      } else {

        /**
         * Checking that a job with jobId is found
         */
        if(listResult.count < 1){
          /**
           * Creating a new job
           */
          jobData.status = "new";
          fh.db({
            act: "create",
            type: "jobs",
            fields: jobData
          }, function(err, data){
            if(err){
              handleError(err, res);
            } else {
              var jobData = data.fields;
              res.json(jobData);
            }
          });
          return;
        }

        var job = listResult.list[0];
        var jobGuid = job.guid;

        /**
         * Updating the job
         */
        fh.db({
          act: "update",
          type: "jobs",
          guid: jobGuid,
          fields: jobData
        }, function(err, data){
          console.log("Finsihed Update", err, data, jobData);
          if(err){
            handleError(err, res);
          } else {
            res.json(data.fields);
          }
        });
      }
    });
  });

  /**
   * Deleting a job
   */
  jobsRouter['delete']('/:jobId', function(req, res) {
    var reqParams = req.params;
    var jobId = reqParams.jobId;

    findJobEntry(jobId, function(err, listResult){
      if(err){
        handleError(err, res);
      } else {
        /**
         * Checking that a job with jobId is found
         */
        if(listResult.count < 1){
          return handleError("No job found matching id " + jobId, res);
        }

        var job = listResult.list[0];
        var jobGuid = job.guid;

        fh.db({
          act: "delete",
          type: "jobs",
          guid: jobGuid
        }, function(err, deletedRecord){
          if(err){
            handleError(err, res);
          } else {
            res.json({});
          }
        });
      }
    });
  });

  return jobsRouter;
}

module.exports = jobRoute;
