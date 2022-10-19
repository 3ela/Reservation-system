var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const schema = new Schema({
  payment_way: {
    type: String,
    required: true
  },
  payment_status: {
    type: Boolean,
    required: true
  },

  //* forign keys
  reservation_id: {
    type: Schema.Types.ObjectId,
    ref: 'Reservation'
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

module.exports = mongoose.model('Payment', schema)