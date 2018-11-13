const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  role: { type: String, enum: ["ADMIN", "STUDENT"], default: "STUDENT" },
  status: { type: String, enum: ["PENDING", "ACTIVE"], default: "PENDING" },
  password: String,
  passwordReset: String,
  _course: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  address: String,
  phone: String,
}, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

const User = mongoose.model('User', userSchema);
module.exports = User;
