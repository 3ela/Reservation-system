var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const schema = new Schema({
  period: {
    start_date: {
      type: Date,
      required: true
    },
    end_date: {
      type: Date,
      required: true
    },
  },

  //* forign keys
  rooms_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Room'
  }],
  hotel_id: {
    type: Schema.Types.ObjectId,
    ref: 'Hotel'
  },
  trip_id: {
    type: Schema.Types.ObjectId,
    ref: 'Trip'
  },
  payment_id: {
    type: Schema.Types.ObjectId,
    ref: 'Payment'
  },
  transportation_id: {
    type: Schema.Types.ObjectId,
    ref: 'Transportation'
  },


},
{ 
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Reservation', schema)