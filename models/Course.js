const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  name: String,
  teacher: String,
  capacity: Number,
  description: String,
  startDate: String,
  _students: [{ type: Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["FUTURE", "ACTIVE"], default: "FUTURE" },
  type: { type: String, enum: ["COURSE", "WORKSHOP"] },
  dates: [Object]
}, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
