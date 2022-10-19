var mongoose = require('mongoose');
let Schema = mongoose.Schema;
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

schema.post('findOneAndDelete', async function(doc, next) {
  //* check rooms and hotels for existance
  //* then delete refrence
  console.log(doc.id)
  await HotelModel.updateMany(
    { amenities_ids: { $in : doc.id } }, 
    { $pull: { amenities_ids: doc.id}}
  ).then(updateRes => {
    console.log("schema.post => updateRes", updateRes)

  }).catch(updateErr => next(updateErr));

  await RoomModel.updateMany(
    { amenities_ids: { $in : doc.id } }, 
    { $pull: { amenities_ids: doc.id } }
  ).then(updateRes => {
    console.log("schema.post => updateRes", updateRes)   

  }).catch(updateErr => next(updateErr));
})

module.exports = mongoose.model('Amenity', schema)