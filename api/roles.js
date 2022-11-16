var express = require('express');
var router = express.Router();
const { mongooseInit } = require('../config/db');
const { validateUser } = require('../config/jwt');
const RoleModel = require('../models/role_model');
const { 
  validateReq,
  roleValidations
} = require('../scripts/validators');

router.post('/', validateUser, (req, res, next) => {
  RoleModel.find({}).then(findRes => {
    //* send back the data
    res.status(200).json({
      auth: true,
      data: findRes
    });
  })
});

router.post('/create', validateUser, roleValidations, (req, res, next) => {
  let payload = {...req.body};

  //* data validation
  validateReq(req, res);

  RoleModel.create(payload, (insertErr, insertRes) => {
    if(insertErr) {
      res.status(400).json("Error inserting User!");
    }else {
      res.status(200).json({
        msg: 'role added',
        data: {
          id: insertRes._id,
          email: insertRes.email,
          name: insertRes.name,
          permissions: insertRes.permissions
        }
      });
    }
  })
});

router.put('/:id/update', validateUser, roleValidations, (req, res, next) => {
  let payload = {...req.body};
  let options = {
    returnDocument: 'after', 
    runValidators: true
  }
  //* data validation
  validateReq(req, res);

  RoleModel.findOneAndUpdate({ _id: req.params.id }, payload, options, (insertErr, insertRes) => {
    if(insertErr) {
      res.status(400).json("Error inserting User!");
    }else {
      res.status(200).json({
        msg: 'role updated',
        data: {
          id: insertRes._id,
          email: insertRes.email,
          name: insertRes.name,
          permissions: insertRes.permissions
        }
      });
    }
  })
});

router.delete('/:id', validateUser, (req, res, next) => {
  
  RoleModel.findByIdAndDelete(req.params.id, { projection: 'name id' }, (delErr, delRes) => {
    if(delErr) {
      res.status(400).json({
        msg: `Error deleteing the role`,
        delErr
      });
    } else {
      res.status(200).json({
        msg: `record deleted`,
        delRes
      });
    }
  })
});

module.exports = router;
