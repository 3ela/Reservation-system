var mongoose = require('mongoose');
let Schema = mongoose.Schema;
const fs = require('fs');
const { HotelModel, RoomModel } = require('./hotel_room_models');

const schema = new Schema({
  name: {
    type: String,
    required: true
  },
  unit_count: {
    type: Number,
  },
  icon: {
    type: Schema.Types.Mixed,
  },  
  icon_path: {
    type: String,
  },
  description: {
     type: String,
  },

  //* forign keys
  // rooms_ids: [{
  //   type: Schema.Types.ObjectId,
  //   ref: 'Room'
  // }],
  // hotels_ids: [{
  //   type: Schema.Types.ObjectId,
  //   ref: 'Hotel'
  // }],

  },
  { 
    timestamps: {
      createdAt: 'created_at', 
      updatedAt: 'updated_at'
    }
  } 
);

// //* return getters on query
// schema.set('toObject', { getters:true } );
schema.pre('findOneAndUpdate', async function(next) {
  const findRes = await this.model.findOne(this.getQuery());
  const payload = this._update;

  if(findRes.icon_path && payload.icon_path) {
    fs.unlink(findRes.icon_path, (err) => {
      if (err) {
        throw err;
      }
      next();
      console.log("Delete File successfully.");
  });
  }
})
schema.post('findOneAndDelete', async function(doc, next) {
  //* check rooms and hotels for existance
  //* then delete refrence
  //* delete any related icon
  if(doc.icon_path) {
    fs.unlink(doc.icon_path, (err) => {
      if (err) {
        throw err;
      }
      console.log("Delete File successfully.");
  });
  }
  await HotelModel.updateMany(
    { amenities_ids: { $in : doc.id } }, 
    { $pull: { amenities_ids: doc.id}}
  ).then(updateRes => {
    
  }).catch(updateErr => next(updateErr));

  await RoomModel.updateMany(
    { amenities_ids: { $in : doc.id } }, 
    { $pull: { amenities_ids: doc.id } }
  ).then(updateRes => {

  }).catch(updateErr => next(updateErr));
})

module.exports = mongoose.model('Amenity', schema)