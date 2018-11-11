const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  email: {type: String, unique: true},
  password: String,
  passwordReset: String,
  _course: Schema.Types.ObjectId
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
