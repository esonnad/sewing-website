const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const requestSchema = new Schema({
  _user: Schema.Types.ObjectId,
  preferences: [String]
}, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

const Request = mongoose.model('Request', requestSchema);
module.exports = Request;
