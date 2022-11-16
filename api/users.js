var express = require('express');
var router = express.Router();
const { mongooseInit } = require('../config/db');
const { hashPassword } = require('../scripts/helpers');
const { createJwt, validateUser } = require('../config/jwt');
const UserModel = require('../models/user_model');
const bcrypt = require('bcrypt');
const { 
  validateReq, 
  signupValidations, 
  loginValidations, 
} = require('../scripts/validators');
const { authUser } = require('../config/permissions');

router.post('/', validateUser, (req, res, next) => {
  
  UserModel.find({})
  .populate('role_id')
  .then(findRes => {
    res.status(200).json({
      msg: 'DBConn',
      data: findRes
    });
  });
})


router.post('/login', loginValidations, (req, res, next) => {
  let payload = {...req.body};
  
  //* data validation
  validateReq(req, res);

  //* check for user existance
  UserModel.findOne({ email: payload.email })
  .then(currentUser => {
    if(currentUser == null) {
      res.status(404).json({
        msg: 'user not found',
        data: payload.email
      });
    }else {
      
      //* compare password
      let passwordMatch = bcrypt.compareSync(payload.password, currentUser.password);
      if(passwordMatch == true) {
        //* create new token
        createJwt({id :currentUser._id, email: currentUser.email})
          .then(token => {
            res.status(200).json({
              msg: 'logged in successfully',
              user: currentUser,
              token
            })
          }).catch(jwtErr => next(jwtErr))
      }else {
        res.status(401).json({
          msg: 'creadintials doesn\'t match',
        })
      }
    }
  })
  
})

router.post('/signup', validateUser, authUser, signupValidations, (req, res, next) => {
  let payload = {
    ...req.body,
    password: hashPassword(req.body.password),
  };

  //* data validation
  validateReq(req, res);

  UserModel.findOne({ email: payload.email })
    .then(currentUser => {
      
      //* check for user existance
      if(currentUser == null) {

        //* create new user
        UserModel.create(payload, (insertErr, insertRes) => {
          if(insertErr) {
            res.status(400).json("Error inserting User!");
          }else {
            res.status(200).json({
              msg: ' users added',
              data: {
                id: insertRes._id,
                email: insertRes.email,
                name: insertRes.name,
              }
            });
          }
        })
      }else {
        res.status(400).json({
          msg: 'user already exists',
          email: currentUser.email,
        })
      }
    })
})

router.post('/logout', (req, res, next) => {
  res.status(200).json({
    msg: 'user logged out'
  });
})

router.put('/:id/update', (req, res, next) => {
  let payload = {
    ...req.body,
    id: req.params.id
  };

  //* connect to the DB
  let options = {
    select: 'id name email role_id',
    returnDocument: 'after'
  }
  UserModel.findByIdAndUpdate(payload.id, payload, options)
    .populate('role_id', 'id name')
    .exec((updateErr, updateRes) => {
      if(updateErr) {
        res.status(500).json({
          msg: `couldn't update`,
          updateErr
        });
      }else {
        res.status(200).json({
          msg: `Updated successfully`,
          updateRes
        });
      }
    })
});

router.post('/:id', validateUser, authUser, (req, res, next) => {
  
  UserModel.findById(req.params.id)
  .populate('role_id')
  .then(findRes => {
    res.status(200).json({
      msg: 'DBConn',
      data: findRes
    });
  });
})

module.exports = router;
// router.post('/signin', (req, res, next) => {
//   let payload = {...req.body};
  
//   //* data validation
//      validateReq(req, res);
//     mongooseInit()
//     //* check for user existance
//     UserModel.findOne({ email: payload.email })
//     .then(currentUser => {
//       console.log("router.post => currentUser", currentUser)
//       if(currentUser == null) {
//         res.status(404).json({
//           msg: 'user not found',
//           data: payload.email
//         });
//       }else {
//         //* compare password
//         let passwordMatch = bcrypt.compareSync(payload.password, currentUser.password);
//         if(passwordMatch == true) {
//           //* create new token
//           createJwt({ email: currentUser.email})
//             .then(token => {
//               res.status(200).json({
//                 msg: 'logged in successfully',
//                 currentUser,
//                 token
//               })
//             }).catch(next)
//         }else {
//           res.status(401).json({
//             msg: 'creadintials doesnt match',
//           })
//         }
//       }
//     }).catch(next)
// })


module.exports = router;