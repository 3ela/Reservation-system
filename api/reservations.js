var express = require('express');
var router = express.Router();
const { authUser } = require('../config/permissions');
const { validateUser } = require('../config/jwt');
const { validateReq, reserveValids } = require('../scripts/validators');
const ItemModel = require('../models/reservation_model');
const { formateDate } = require('../scripts/helpers');


router.post('/', validateUser, authUser, (req, res, next) => {

  ItemModel.find({})
    .then(findRes => {
      res.status(200).json({
        msg: `Items Found`,
        data: findRes
      });
    }).catch(findErr => {
      res.status(400).json({
        msg: `Error while listing Items`,
        err: findErr
      });
    })
});

//? look at schema pre and post hooks
router.post('/create', validateUser, authUser, reserveValids, (req, res, next) => {
  let payload = {  ...req.body  };

    //* formate Date
    payload.period?.start_date ? payload.period.start_date = formateDate(payload.period?.start_date, `DD-MM-YYYY`) : '';
    payload.period?.end_date ? payload.period.end_date = formateDate(payload.period?.end_date, `DD-MM-YYYY`) : '';
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



router.put('/:id/update', validateUser, authUser, reserveValids, (req, res, next) => {
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


router.patch('/:id/cancel', (req, res, next) => {

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