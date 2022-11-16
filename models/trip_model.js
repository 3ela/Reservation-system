var mongoose = require('mongoose');
// const { HotelModel, checkRoomInHotel } = require('./hotel_room_models');
// const { TransportationModel, checkForTransportationCapacity } = require('./transportationmodel');
let Schema = mongoose.Schema;

const schema = new Schema({
  time: {
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      required: true
    },
  },
  reservation_capacity: {
    type: Number,
  },

  //* forign keys
  destination_id: {
    type: Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  },
  reservations_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Reservation'
  }],
  rooms_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Room'
  }],
  hotels_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Hotel'
  }],
  transportations_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Transportation'
  }],

 },
{ 
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  }
});


module.exports = mongoose.model('Trip', schema)