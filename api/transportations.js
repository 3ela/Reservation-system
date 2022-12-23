var express = require('express');
var router = express.Router();
const { authUser } = require('../config/permissions');
const { validateUser } = require('../config/jwt');
const { validateReq, transValids: itemValids } = require('../scripts/validators');
const {
  TransportationModel: ItemModel,
  RouteModel
} = require('../models/transportation_route_models');


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


router.post('/create', validateUser, authUser, itemValids, (req, res, next) => {
  let payload = { ...req.body };
  
  //* data validation
  validateReq(req, res, next);

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

router.patch('/:id/assign_transport', validateUser, authUser, (req, res, next) => {
  let payload = {
    id: req.params.id,
    route_id: req.body.route_id
  };
  //* check for the deassign
  if(!payload.route_id) {
    payload = {
      id: payload.id,
      $unset: { route_id: ''},
      vehicle_status: 'available'
    }
  }
  //* add transport id to the route 
  ItemModel.updateOne(
    { _id: payload.id }, 
    payload, 
    { returnDocument: 'after' })
    .then(updateRes => {
      //! check if the transport exist
      //* add that id if not exist in the transport
      res.status(200).json({
        msg: `Transport Updated`,
        data: updateRes
      });
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


// todo trans data validation
module.exports = router;