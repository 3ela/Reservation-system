var express = require('express');
var router = express.Router();
const { authUser } = require('../config/permissions');
const { validateUser } = require('../config/jwt');
const { validateReq, tripValids: itemValids  } = require('../scripts/validators');
const ItemModel = require('../models/trip_model');


router.post('/', validateUser, authUser, (req, res, next) => {

  ItemModel.find({})
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
});

//? look at schema pre and post hooks
router.post('/create', validateUser, authUser, itemValids, (req, res, next) => {

  //* data validation
  validateReq(req, res);

  ItemModel.create(payload)
    .then(createRes => {
      res.status(200).json({
        msg: `Created Successfully`,
        data: createRes
      });
    }).catch(createErr => next(createErr))
});


router.post('/:id', validateUser, authUser, (req, res, next) => {
  ItemModel.findById(req.params.id)
    .then(findRes => {
      if(findRes == null) {
        res.status(404).json({
          msg: `Transportaion does not exist`,
        });
      }else {
        res.status(200).json({
          msg: `Transportaion Found`,
          data: findRes
        });
      }
    }).catch(findErr => next(findErr)) 
});



router.put('/:id/update', validateUser, authUser, itemValids, (req, res, next) => {
  let payload = {
    ...req.body,
    id: req.params.id
  };

  //* validate data
  validateReq(req, res);

  ItemModel.findOneAndUpdate({ _id: payload.id }, payload, { returnDocument: 'after'})
    .then(updateRes => {
      if(updateRes == null) {
        res.status(404).json({
          msg: `Transport does not exist`,
        }); 
      } else {
        res.status(200).json({
          msg: `Transportation Updated`,
          data: updateRes
        });
      }
    }).catch(updateErr => next(updateErr))

});


router.delete('/:id/delete', (req, res, next) => {

  ItemModel.findOneAndDelete({ _id: req.params.id })
    .then(deleteRes => {
      res.status(200).json({
        msg: `Record deleted`,
        data: deleteRes
      }); 
    }).catch(deleteRes => next(deleteRes))
});


// todo Item data validation
module.exports = router;