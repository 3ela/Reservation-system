var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const schema = new Schema({
  vehicle: {
    company: String, 
    model: String,
    manfacture_year: Number,
    capacity: {
      number: {
        type: Number,
        required: true
      },
      seats_model: {
        type: String,
        enum: {
          values: ['54A', '32A', '18A', '13B'],
        },
        required: true,
      },
    },
  },
  vehicle_licence: {
    licence_id: {
      type: String,
      required: true
    },
    expire_year: {
      type: Number,
      required: true
    }
  },
  vehicle_status: {
    type: String,
    enum: ['available', 'assigned', 'on_route', 'broken', 'getting_repaires'],
    default: 'available'
  },
  reserve_module: {
    type: String,
    enum: ['trips', 'transports'],
    default: 'transports',
    required: true
  },

  //* forign keys
  route_id: {
    type: Schema.Types.ObjectId, 
    ref: 'Route'
  },
  reservations_list: [{
    licence_id: {
      type: Schema.Types.ObjectId, 
      ref: 'Reservation'
    },
    seat_number: {
      type: Number
    }
  }],
  driver: {
    user_id: {
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

//? transportation_route_models

module.exports = schema;