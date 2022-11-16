var express = require('express');
var router = express.Router();
const { authUser } = require('../config/permissions');
const { validateUser } = require('../config/jwt');
const { validateReq, placeValids: itemValids  } = require('../scripts/validators');
const ItemModel = require('../models/places_model');


router.post('/', validateUser, authUser, (req, res, next) => {
  let payload = { ...req.body };
  let areaType = payload.type == 'city' ? false : true; 

  ItemModel.find({ parent_id: {$exists: areaType} })
    .then(findRes => {
      res.status(200).json({
        msg: `Items Found`,
        data: findRes
      });
    }).catch(findErr => {
      res.status(400).json({
        msg: `Error while listing items`,
        err: findErr
      });
    })
});

//? look at schema pre and post hooks
router.post('/create', validateUser, authUser, itemValids, (req, res, next) => {
  let payload = { ...req.body };
  
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
          msg: `Item does not exist`,
        });
      }else {
        res.status(200).json({
          msg: `Item Found`,
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
  let options = {
    returnDocument: 'after', 
    runValidators: true
  };

  //* validate data
  validateReq(req, res);

  ItemModel.findOneAndUpdate({ _id: payload.id }, payload, options)
    .then(updateRes => {
      if(updateRes == null) {
        res.status(404).json({
          msg: `Item does not exist`,
        }); 
      } else {
        res.status(200).json({
          msg: `Item Updated`,
          data: updateRes
        });
      }
    }).catch(updateErr => next(updateErr))

});


router.delete('/:id', (req, res, next) => {

  ItemModel.findOneAndDelete({ _id: req.params.id })
    .then(deleteRes => {
      res.status(200).json({
        msg: `Item deleted`,
        data: deleteRes
      }); 
    }).catch(deleteRes => next(deleteRes))
});


// todo Item data validation
module.exports = router;