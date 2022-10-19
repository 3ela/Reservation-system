var express = require('express');
var router = express.Router();
const { mongooseInit, checkItemExistance } = require('../config/db');
const { validateUser } = require('../config/jwt');
const { checkPermissionExistance, authUser } = require('../config/permissions');
const { 
  validateReq, 
  hotelValids, 
} = require('../scripts/validators');
const { HotelModel } = require('../models/hotel_room_models');

router.post('/', validateUser, (req, res, next) => {
  //* connect to the DB
  mongooseInit().then(DBRes => {
    HotelModel.find({}, (findErr, findRes) => {
      res.status(200).json({
        msg: `Hotels found`,
        data: findRes
      });
    })  
  }).catch(DBerr => next(DBerr))
});

//? look hooks in hotel model for handling rooms
router.post('/create', validateUser, authUser, (req, res, next) => {
  let payload = {...req.body};

  //* check if user has permissions for room manipulation
  if(payload.rooms && payload.rooms.length > 0) {
    checkPermissionExistance(req, 'rooms.create', next);
  }
  //* data validation
  validateReq(req, res);

  //* connect to the DB
  mongooseInit().then(DBRes => {
    HotelModel.create(payload).then(createRes => {
      res.status(200).json({
        msg: `Hotel Created`,
        data: createRes
      });
    }).catch(createErr => {
      res.status(400).json({
        err: createErr
      });
    })
  }).catch(DBerr => next(DBerr));
});

router.post('/:id', validateUser, (req, res, next) => {
  //* connect to the DB
  mongooseInit().then(DBRes => {
    HotelModel.findById(req.params.id).then(findRes => {
      if(findRes == null) {
        res.status(404).json({
          msg: `Hotel does Not exist`,
        });
      }
      res.status(200).json({
        msg: `Hotel Found`,
        data: findRes
      });
    }).catch(findErr => next(findErr))
  }).catch(DBerr => next(DBerr))
});

//? look hooks in hotel model for handling rooms
router.put('/:id/update', validateUser, authUser, hotelValids, (req, res, next) => {
  let payload = {
    ...req.body,
    id: req.params.id
  };
  
  //* check if user has permissions for room manipulation
  if(payload.rooms && payload.rooms.length > 0) {
    payload.rooms.forEach(room => {
      if (room.delete) checkPermissionExistance(req, 'rooms.delete', next);
      if (room.id && !room.delete) checkPermissionExistance(req, 'rooms.update', next);
      if (!room.id) checkPermissionExistance(req, 'rooms.create', next);
    })
  }

  //* data validation
  validateReq(req, res);

  //* connect to the DB
  mongooseInit().then(DBRes => {
    HotelModel.findOneAndUpdate({ _id: payload.id}, payload, { returnDocument: 'after'})
      .then(upadteRes => {
        if(upadteRes == null) {
          res.status(400).json({
            msg: `Hotel Does not exist`,
          });
        }
        res.status(200).json({
          msg: `updated successfully`,
          data: upadteRes
        });
      }).catch(updateErr => next(updateErr))
  }).catch(DBerr => next(DBerr))
});

//? look hooks in hotel model for handling rooms
router.delete('/:id/delete', validateUser, (req, res, next) => {

  //* connect to the DB
  mongooseInit().then(DBRes => {
    HotelModel.findOneAndDelete({ _id: req.params.id})
      .then(deleteRes  => {
        res.status(200).json({
          msg: `Deleted Successfully`,
          data: deleteRes
        });
      })
      .catch(deleteErr  => next(deleteErr))
  }).catch(DBerr => next(DBerr))
});


// todo delete many if needed
// router.delete('/many', validUser, (req, res, next) => {

// });


module.exports = router;
