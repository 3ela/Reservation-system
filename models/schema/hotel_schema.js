var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const schema = new Schema({
  name: {
     type: String,
     required: true
  },
  city: {
     type: String,
     required: true
  },
  address: {
    type: String
  },

  //* forign keys
  amenities_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Amenity'
  }],
  rooms_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Room',
    alias: '  '
  }],
  reservations_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Reservation'
  }],
  },
  {
    virtuals: {
      rooms: []
    }
  },
  { 
    timestamps: {
      createdAt: 'created_at', 
      updatedAt: 'updated_at'
    }
  }, 

);

//? hotel_room_models


module.exports = schema;