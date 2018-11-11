const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseSchema = new Schema({
<<<<<<< HEAD
  courseName: String,
  _students: [Schema.Types.ObjectId]
=======
  name: String,
  _students: [Schema.Types.ObjectId],
  dates: [Object]
>>>>>>> 38e016a4229175f7c67f464a1208b7b5bf535496
}, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
