var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const schema = new Schema({
  number: {
     type: Number,
     required: true,
     unique: false
  },
  type: {
     type: String,
  },
  guest_capacity: {
     type: Number,
     required: true
  },
  price_per_night: {
     type: Number,
     required: true
  },
  reserve_status: {
     type: Boolean,
     default: false
   },

  // forign keys
  amenities_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Amenity'
  }],
  hotel_id: {
    type: Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  reservation_id: {
    type: Schema.Types.ObjectId,
    ref: 'Reservation'
  },
},
{ 
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  }
});

//? hotel_room_models
  
module.exports = schema;