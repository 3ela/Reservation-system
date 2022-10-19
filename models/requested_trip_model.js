var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const schema = new Schema({
  city: {
     type: String,
     required: true
  },
  time: {
    start_date: Date,
    end_date: Date,
  },

  //* forign keys
  trip_id: {
    type: Schema.Types.ObjectId,
    ref: 'Trip'
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },


  },
  { 
    timestamps: {
      createdAt: 'created_at', 
      updatedAt: 'updated_at'
    }
  } 
);

module.exports = mongoose.model('RequestedTrips', schema)