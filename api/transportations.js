var express = require('express');
var router = express.Router();
const { mongooseInit } = require('../config/db');
const { authUser } = require('../config/permissions');
const { validateUser } = require('../config/jwt');
const TransportationModel = require('../models/transportation_model');


router.post('/', validateUser, authUser, (req, res, next) => {

  //* connect to the DB
  mongooseInit().then(DBRes => {
    TransportationModel.find({})
      .then(findRes => {
        res.status(200).json({
          msg: `Transports Found`,
          data: findRes
        });
      }).catch(findErr => {
        res.status(400).json({
          msg: `Error while listing transports`,
          err: findErr
        });
      })
  }).catch(DBerr => next(DBerr))
});

module.exports = router;