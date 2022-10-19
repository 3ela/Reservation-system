var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const schema = new Schema({
  name: {
     type: String,
     required: true
  },
  coordinates: {
    long: Number,
    lat: Number,
  }

},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
}
);

module.exports = mongoose.model('Place', schema)