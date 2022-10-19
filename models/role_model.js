var mongoose = require('mongoose');
let Schema = mongoose.Schema;

const schema = new Schema({
  name: {
     type: String,
     required: true
  },
  permissions: [ String ],

  //* forign keys
  // users_ids: [{
  //   type: Schema.Types.ObjectId,
  //   ref: 'User'
  // }],
},
{ 
  timestamps: {
    createdAt: 'created_at', 
    updatedAt: 'updated_at'
  }
});

module.exports = mongoose.model('Role', schema)