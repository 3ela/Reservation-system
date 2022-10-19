var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const schema = new Schema({
  vehicle: {
    company: String, 
    model: String,
    manfacture_year: Number,
    capacity: Number,
  },
  vehicle_licence_id: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['working', 'broken', 'getting repaires'],
  },

  //* forign keys
  route_id: {
    type: Schema.Types.ObjectId, 
    ref: 'Route'
  },
  trip_id: {
    type: Schema.Types.ObjectId, 
    ref: 'Trip'
  },
  driver: {
    id: {
      type: Schema.Types.ObjectId, 
      ref: 'User'
    },
    driver_licence_id: {
      type: String,
      required: true
    },
    driver_national_id: {
      type: String,
      required: true
    },
  }

},
{ 
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Transportation', schema)