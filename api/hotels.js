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
  
  HotelModel.find({}, (findErr, findRes) => {
    res.status(200).json({
      msg: `Hotels found`,
      data: findRes
    });
  }); 
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

  HotelModel.create(payload).then(createRes => {
    res.status(200).json({
      msg: `Hotel Created`,
      data: createRes
    });
  }).catch(createErr => {
    res.status(400).json({
      err: createErr
    });
  });
 
});

router.post('/:id', validateUser, (req, res, next) => {
  
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
 });

//? look hooks in hotel model for handling rooms
router.put('/:id/update', validateUser, authUser, hotelValids, (req, res, next) => {
  let payload = {
    ...req.body,
    id: req.params.id
  };
  let options = {
    returnDocument: 'after', 
    runValidators: true
  }
  
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
  
  HotelModel.findOneAndUpdate({ _id: payload.id}, payload, options)
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
 });

//? look hooks in hotel model for handling rooms
router.delete('/:id/delete', validateUser, (req, res, next) => {
  
  HotelModel.findOneAndDelete({ _id: req.params.id})
    .then(deleteRes  => {
      res.status(200).json({
        msg: `Deleted Successfully`,
        data: deleteRes
      });
    }).catch(deleteErr  => next(deleteErr))
 });


// todo delete many if needed
// router.delete('/many', validUser, (req, res, next) => {

// });

// todo hotel data validation
module.exports = router;
