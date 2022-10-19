var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const schema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
  },

  //* forign keys
  role_id: {
    type: Schema.Types.ObjectId, 
    ref: 'Role'
  }

},
{ 
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('User', schema)