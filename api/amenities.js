var express = require('express');
var router = express.Router();
const { validateUser } = require('../config/jwt');
const { amenityValids, validateReq } = require('../scripts/validators');
const { mongooseInit } = require('../config/db');
const AmenityModel = require('../models/amenity_model');
const { authUser } = require('../config/permissions');
const { amenityUpload } = require('../config/multer');

router.post('/', validateUser, authUser, (req, res, next) => { 
  
  //* connect to the DB
  mongooseInit().then(DBRes => {
    AmenityModel.find({}) 
    .then(findRes => {
      res.status(200).json({
        msg: `Amenities Found`,
        data: findRes
      });
    }).catch(findErr => next(findErr))
  }).catch(DBerr => next(DBerr))
});


router.post('/create', validateUser, amenityUpload, amenityValids, (req, res, next) => {
  let payload = {
    ...req.body,
    icon: {
      ...req.file,
      full_path: process.env.IMAGE_PATH + req.file.filename
    }
  };
  //* data validations
  validateReq(req, res);
  
  //* connect to the DB
  mongooseInit().then(DBRes => {
    AmenityModel.create(payload)
    .then(createRes => {
      res.status(200).json({
        msg: `Created Successfully`,
        data: createRes
      });
    }).catch(createErr  => next(createErr))
  }).catch(DBerr => next(DBerr))
});

router.post('/:id', validateUser, authUser, (req, res, next) => {
  
  //* connect to the DB
  mongooseInit().then(DBRes => {
    AmenityModel.findById(req.params.id) 
    .then(findRes => {
      res.status(200).json({
        msg: `Amenity Found`,
        data: findRes
      });
    }).catch(findErr => next(findErr))
  }).catch(DBerr => next(DBerr))
});

router.put('/:id/update', validateUser, amenityValids, authUser, (req, res, next) => {
  let payload = {
    ...req.body,
    id: req.params.id,
  }
  //* data validations
  validateReq(req, res);

  //* connect to the DB
  mongooseInit().then(DBRes => {
    AmenityModel.findOneAndUpdate({ _id: payload.id }, payload, { returnDocument: 'after'})
    .then(updateRes => {
      if(updateRes == null) {
        res.status(404).json({
          msg: `Amenity does not exist`,
        });
      }else {
        res.status(200).json({
          msg: `Updated Successfully`,
          data: updateRes
        });
      }
    }).catch(updateErr  => next(updateErr))
  }).catch(DBerr => next(DBerr))
});


router.delete('/:id/delete', validateUser, authUser, (req, res, next) => {
  let payload = req.params.id;

  //* connect to the DB
  mongooseInit().then(DBRes => {
    AmenityModel.findOneAndDelete({ _id: payload })
    .then(deleteRes => {
      if(deleteRes == null) {
        res.status(404).json({
          msg: `Amenity does not exist`,
        });
      }else {
        res.status(200).json({
          msg: `Deleted Successfully`,
          data: deleteRes
        });
      }
    }).catch(deleteErr  => next(deleteErr))
  }).catch(DBerr => next(DBerr))
});



module.exports = router;