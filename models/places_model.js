var mongoose = require('mongoose');
let Schema = mongoose.Schema;
const { checkItemExistance } = require('../config/db');

const schema = new Schema({
  name: {
    type: String,
    required: true
  },
  address_details: {
    type: String
  },
  coordinates: {
    long: Number,
    lat: Number,
  },
  parent_id: {
    type: Schema.Types.ObjectId,
    ref: 'Place'
  }

},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
});



//* create hook check if parent_id exist 
schema.pre('save', function(next) {
  let payload = this;
  
  if( payload.parent_id ) {
    checkItemExistance(model, { _id: payload.parent_id })
      .then(checkRes => {
        if(checkRes == null) {
          next({
            msg: "parent doesn't Exist",
            parent_id: payload.parent_id
          })
        } else if( checkRes.parent_id && checkRes.parent_id != null ) {
          next({
            msg: "current place cant be a parent",
            place: checkRes
          })
        } else {
          next();
        }
      }).catch(checkErr => next(checkErr))
    } else {
      next();
    }
  })
  
  //* update hook check if current_id and parent_id exist 
  schema.pre('findOneAndUpdate', async function(next) {
    const findRes = await this.model.findOne(this.getQuery());
    const payload = this._update;
    
    if(findRes != null) {
      if( payload.parent_id && (payload.parent_id != findRes.parent_id) ) {
        await checkItemExistance(model, { _id: payload.parent_id })
          .then(checkRes => {
            if(checkRes == null) {
              next({
                msg: "parent doesn't Exist",
                parent_id: payload.parent_id
              })
            } else if( checkRes.parent_id && checkRes.parent_id != null ) {
              next({
                msg: "current place cant be a parent",
                place: checkRes
              })
            } else {
              next();
            }
          }).catch(checkErr => next(checkErr))
        } else {
          next();
        }
    } else {
      next({
        msg: 'item doesnt exist',
        data: payload
      })
    }
    
  })
  
  //todo aggregator for all the children of this place on listing
  //? No delete places hooks as the objects doesnt carry more than one
  //? the user just update the other objects with new Ids
  

  //? function check existance of the place
  //* use the function inside db.js to cehck for item

  let model = mongoose.model('Place', schema)
  
  module.exports = model;