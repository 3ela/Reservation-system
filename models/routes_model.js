var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const schema = new Schema({
  time: {
    start_time: {
      type: Date,
      required: true  
    },
    end_time: {
      type: Date,
      required: true
    },
  },
  departure_point: {
    type: String,
    required: true
  },
  destination_point: {
    type: String,
    required: true
  },

  //* forign key
  trasportaion_ids: [{
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

module.exports = mongoose.model('Route', schema)