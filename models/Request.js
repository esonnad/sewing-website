const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestSchema = new Schema({
  _user: Schema.Types.ObjectId,
  _preferences: [{ type: Schema.Types.ObjectId, ref: "Course" }]
}, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
