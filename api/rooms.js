var express = require('express');
var router = express.Router();
const { mongooseInit, checkItemExistance, checkRoomExistanceInHotel } = require('../config/db');
const { validateUser } = require('../config/jwt');
const { 
  validateReq, 
  roomValids, 
  roomUpdateValids, 
  roomDeleteManyValids,
} = require('../scripts/validators');
const { RoomModel } = require('../models/hotel_room_models');

router.post('/', validateUser, (req, res, next) => {
  //* connect to the DB
  mongooseInit().then(DBRes => {
    RoomModel.find({}, (findErr, findRes) => {
      if(findErr) {
        res.status(500).json({
          msg: `Error in Listing Romms`,
          err: findErr
        });
      }else {
        res.status(200).json({
          msg: `Rooms found`,
          data: findRes
        });
      }
    })
  }).catch(DBerr => next(DBerr))
});

//? ---- Room Model
//? look at schema pre and post hooks
router.post('/create', validateUser, roomValids, (req, res, next) => {
  let payload = {...req.body};
  //* validate data
  validateReq(req, res);

  //* connect to the DB
  mongooseInit().then(DBRes => {

    //* else create the room
    RoomModel.create(payload, (createErr, createRes) => {
      if(createErr) {
        res.status(400).json({
          err: createErr
        });
      }else {
        res.status(200).json({
          msg: `Room Created`,
          data: createRes
        });
      }
    })
  }).catch(DBerr => next(DBerr))
});

router.post('/:id', validateUser, (req, res, next) => {
  //* connect to the DB
  mongooseInit().then(DBRes => {
    RoomModel.findById(req.params.id).then(findRes => {
      if(findRes == null) {
        res.status(404).json({
          msg: `Room does not exist`,
        });
      }
      res.status(200).json({
        msg: `Room Found`,
        data: findRes
      });
    }).catch(findErr => next(findErr))
  }).catch(DBerr => next(DBerr))
});

//? ----- look room model to see pre post hooks
//? check for room existance
router.put('/:id/update', validateUser, roomValids, (req, res, next) => {
  let payload = {
    number: req.body.number,
    type: req.body.type,
    reserve_status: req.body.reserve_status,
    guest_capacity: req.body.guest_capacity,
    price_per_night: req.body.price_per_night,
    hotel_id: req.body.hotel_id,
    amenities_ids: req.body.amenities_ids,
    id: req.params.id
  };
  //* validate data
  validateReq(req, res);
  
  //* connect to the DB
  mongooseInit().then(DBRes => {
    let options = {
      returnDocument: 'after'
    }
    //* update room
    RoomModel.findOneAndUpdate({ _id: payload.id }, payload, options, (updateErr, updateRes) => {
      if(updateErr) {
        res.status(500).json({
          msg: `update Error`,
          err: updateErr
        });
      }else {
        res.status(200).json({
          msg: `Update successfully`,
          data: updateRes
        });
      }
    })
  }).catch(DBerr => next(DBerr))
});

//? ----- look room model to see pre post hooks
router.delete('/:id/delete', validateUser, (req, res, next) => {
  let payload = req.params.id;

  //* connect to the DB
  mongooseInit().then(DBRes => {
    RoomModel.findOneAndDelete({ _id: payload })
    .then(removeRes => {
      res.status(200).json({
        msg: `remove success`,
        data: removeRes
      });
    }).catch(removeErr => {
      res.status(500).json({
        msg: `Remove Error`,
        err: removeErr
      });
    })
  }).catch(DBerr => next(DBerr))
});

router.delete('/many', validateUser, roomDeleteManyValids, (req, res, next) => {
  if(req.body.rooms_ids && req.body.rooms_ids?.length != 0) {
    payload = [...req.body.rooms_ids];
  }

  //* validate data
  validateReq(req, res);

  //* connect to the DB
  mongooseInit().then(DBRes => {
    RoomModel.deleteMany({ _id: { $in: [...payload] } })
    .then(removeRes => {
      res.status(200).json({
        msg: `remove success`,
        data: removeRes
      });
    }).catch(removeErr => {
      res.status(500).json({
        msg: `Remove Error`,
        err: removeErr
      });
    })
  }).catch(DBerr => next(DBerr))
});




module.exports = router;

