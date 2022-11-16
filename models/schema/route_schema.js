var mongoose = require('mongoose');
let Schema = mongoose.Schema;
const { formateDate, isDatePassed } = require('../../scripts/helpers');
const { checkItemExistance } = require('../../config/db');

const schema = new Schema({
  time: {
    take_off_time: {
      type: Date,
      required: true  
    },
    arrival_time: {
      type: Date,
      required: true
    },
  },

  //* forign key
  departure_place_id: {
    type: Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  },
  destination_place_id: {
    type: Schema.Types.ObjectId,
    ref: 'Place',
    required: true
  },

  transportaion_ids: [{
    type: Schema.Types.ObjectId,
    ref: 'Transportation'
  }]

},
{ 
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  }
});

//? transportation_route_models

module.exports = schema;