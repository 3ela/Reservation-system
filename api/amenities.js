var express = require('express');
var router = express.Router();
const { validateUser } = require('../config/jwt');
const { amenityValids, validateReq } = require('../scripts/validators');
const { mongooseInit } = require('../config/db');
const AmenityModel = require('../models/amenity_model');
const { authUser } = require('../config/permissions');
const { amenityUpload } = require('../config/multer');

router.post('/', validateUser, authUser, (req, res, next) => { 
  
  AmenityModel.find({}) 
  .then(findRes => {
    res.status(200).json({
      msg: `Amenities Found`,
      data: findRes
    });
  }).catch(findErr => next(findErr))
});


router.post('/create', validateUser, amenityUpload, amenityValids, (req, res, next) => {
  let payload = {
    ...req.body,
  };
  if(payload.icon) {
    payload.icon = {
      ...req.file,
      full_path: process.env.IMAGE_PATH + req.file.filename
    };
    payload.icon_path = `${url}/uploads/images/${req.file.filename}`;
  }
  //* data validations
  validateReq(req, res);
  
  AmenityModel.create(payload)
  .then(createRes => {
    console.log(createRes);
    res.status(200).json({
      msg: `Created Successfully`,
      data: createRes
    });
  }).catch(createErr  => next(createErr))
});

router.post('/:id', validateUser, authUser, (req, res, next) => {
  
    AmenityModel.findById(req.params.id) 
    .then(findRes => {
      res.status(200).json({
        msg: `Amenity Found`,
        data: findRes
      });
    }).catch(findErr => next(findErr))
});

router.put('/:id/update', validateUser, amenityUpload, amenityValids, authUser, (req, res, next) => {
  // const url = req.protocol + '://' + req.get("host");
  const url = process.env.LOCALURL;

  let payload = {
    ...req.body,
    id: req.params.id,
  }
  if(payload.icon || req.file) {
    payload.icon = {
      ...req.file,
      full_path: process.env.IMAGE_PATH + req.file.filename
    };
    payload.icon_path = `${url}/uploads/images/${req.file.filename}`;
  }
  let options = {
    returnDocument: 'after', 
    runValidators: true
  }
  
  //* data validations
  validateReq(req, res);
  
  AmenityModel.findOneAndUpdate({ _id: payload.id }, payload, options)
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
});


router.delete('/:id/delete', validateUser, authUser, (req, res, next) => {
  let payload = req.params.id;

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
});


// todo amenity data validation
module.exports = router;