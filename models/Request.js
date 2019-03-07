const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestSchema = new Schema({
  _user: { type: Schema.Types.ObjectId, ref: "User" },
  _share: { type: Schema.Types.ObjectId, ref: "User" },
  _preferences: [{ type: Schema.Types.ObjectId, ref: "Course" }]
}, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
