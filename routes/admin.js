const express = require('express');
const router = express.Router();
const Post = require('../models/Post')
const Course = require('../models/Course')
const User = require('../models/User')
const Equipment = require('../models/Equipment')
const multer = require('multer');
const uploadCloud = require('../config/cloudinary.js');
const nodemailer = require('nodemailer');
const Request = require('../models/Request')

function ensureAuthenticated(req, res, next) {
  if (req.user) {
    return next();
  } else {
    res.redirect('/auth/login')
  }
}

function checkRole(role) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next()
    }
    else {
      res.redirect('/noAccess')
    }
  }
}

router.get('/', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  res.render('admin/adminPage')
})

router.get('/postAdmin', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  res.render('admin/postAdmin')
})

router.post('/postAdmin', ensureAuthenticated, checkRole("ADMIN"), uploadCloud.single('photo'), (req, res, next) => {
  const content = req.body.text;
  const header = req.body.title;
  const creatorId = req.user._id;

  const newPost = new Post({
    header: header,
    content: content,
    imgPath: req.file.url,
    imgName: req.file.originalname,
    _creator: creatorId,
    status: "ACTIVE"
  })
  newPost.save()
    .then(() => {
      res.redirect('/')
    })
    .catch(err => {
      console.log(err)
    })
})

router.get('/confirmPost/:id', (req, res, next) => {
  let id = req.params.id;
  Post.findByIdAndUpdate(id, { status: "ACTIVE" })
    .then(post => {
      res.render("admin/confirmed-post")
    })
    .catch(err => { console.log(err), res.render("admin/confirmed-failed") })
})

router.get('/equipment', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  Equipment.find()
    .then(eq => {
      res.render('admin/equipment', { equipment: eq })
    })
    .catch(err => {
      console.log(err)
    })
})

router.get('/equipment/new', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  res.render('admin/newEquipment')
})

router.post('/equipment/new', ensureAuthenticated, checkRole("ADMIN"), uploadCloud.single('photo'), (req, res, next) => {
  const content = req.body.text;
  const header = req.body.title;

  const newEquipment = new Equipment({
    header: header,
    content: content,
    imgPath: req.file.url,
    imgName: req.file.originalname,
  })
  newEquipment.save()
    .then(() => {
      res.redirect('/admin/equipment')
    })
    .catch(err => { console.log(err) })
})

router.get('/equipment/delete/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;

  Equipment.findByIdAndRemove(id)
    .then(sth => {
      res.redirect('/admin/equipment')
    })
})

router.get('/courses', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  Promise.all([Course.find({ type: "WORKSHOP" }), Course.find({ type: "COURSE", status: "ACTIVE" }), Course.find({ type: "COURSE", status: "FUTURE" })])
    .then(([workshops, activeCourses, futureCourses]) => {
      res.render('admin/allCourses', {
        workshops: workshops,
        futureCourses: futureCourses,
        activeCourses: activeCourses,
      })
    })
    .catch(err => { console.log(err) })
})

router.get('/courses/add', (req, res, next) => {
  res.render('admin/add-course')
})
router.post('/courses/add', (req, res, next) => {
  const name = req.body.name;
  const teacher = req.body.teacher;
  const capacity = req.body.capacity;
  const type = req.body.type;
  const dates = req.body.date;
  const description = req.body.description;
  const startDate = req.body.startDate;

  const newCourse = new Course({
    name: name,
    teacher: teacher,
    capacity: capacity,
    status: "FUTURE",
    type: type,
    dates: dates,
    description: description,
    startDate: startDate,
  })
  newCourse.save()
    .then(() => {
      res.redirect('/admin/courses')
    })
    .catch(err => { console.log(err) })
})

router.get('/courses/details/:id', (req, res, next) => {
  let id = req.params.id;
  Course.findById(id)
    .populate('_students')
    .then(course => {
      res.render('admin/course-detail', { course: course })
    })
    .catch(err => { console.log(err) })
})
router.get('/courses/details/:id/edit', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;
  Promise.all([Course.findById(id).populate("_students"), User.find()])
    .then(([course, student]) => {
      res.render('admin/course-edit', {
        course: course,
        student: student
      })
    })
    .catch(err => { console.log(err) })
})
router.post('/courses/details/:id/add-student', (req, res, next) => {
  let id = req.params.id;
  const student = req.body.student;
  Course.findByIdAndUpdate(id, { $push: { _students: student } })
    .then(sth => { res.redirect(`/admin/courses/details/${id}/edit`) })
    .catch(err => { console.log(err) })
})
router.get('/courses/details/:courseid/remove-student/:studentid', (req, res, next) => {
  let studentid = req.params.studentid;
  let courseid = req.params.courseid;
  Course.findByIdAndUpdate(courseid, { $pull: { _students: studentid } })
    .then(sth => { res.redirect(`/admin/courses/details/${courseid}/edit`) })
    .catch(err => { console.log(err) })
})
router.post('/courses/details/:id/add-date', (req, res, next) => {
  let id = req.params.id;
  const date = req.body.date;
  if (date !== "") {
    Course.findByIdAndUpdate(id, { $push: { dates: { date: date } } })
      .then(sth => { res.redirect(`/admin/courses/details/${id}/edit`) })
      .catch(err => { console.log(err) })
  }
  else {
    res.redirect(`/admin/courses/details/${id}`)
  }
})
router.get('/courses/details/:courseid/remove-date/:date', (req, res, next) => {
  let date = req.params.date;
  let courseid = req.params.courseid;
  Course.findByIdAndUpdate(courseid, { $pull: { dates: { date: date } } })
    .then(sth => { res.redirect(`/admin/courses/details/${courseid}/edit`) })
    .catch(err => { console.log(err) })
})
router.post('/courses/details/:id/edit', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;
  const name = req.body.name;
  const teacher = req.body.teacher;
  const capacity = req.body.capacity;
  const description = req.body.description;
  const dates = req.body.date;
  const startDate = req.body.startDate;

  Course.findByIdAndUpdate(id, {
    name: name,
    teacher: teacher,
    capacity: capacity,
    description: description,
    dates: dates,
    startDate: startDate,
  })
    .then(course => { res.redirect(`/admin/courses/details/${id}`) })
    .catch(err => { console.log(err) })
})

router.get('/courses/delete/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;

  Course.findByIdAndRemove(id)
    .then(sth => {
      res.redirect('/admin/courses')
    })
})

router.get('/students', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  Promise.all([User.find({ role: "STUDENT", status: "PENDING" }), User.find({ role: "STUDENT", status: "ACTIVE" })])
    .then(([pendingStudents, activeStudents]) => {
      res.render('admin/students', { pendingStudents: pendingStudents, activeStudents: activeStudents })
    })
    .catch(err => { console.log(err) })
})

router.get('/students/delete/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;

  User.findByIdAndRemove(id)
    .then(sth => {
      res.redirect('/admin/students')
    })
})

router.get('/students/edit/:id', (req, res, next) => {
  let id = req.params.id;

  User.findById(id)
    .then(student => { res.render('admin/student-detail', { student: student }) })
    .catch(err => { console.log(err) })
})

router.post('/students/edit/:id', (req, res, next) => {
  let id = req.params.id;
  const email = req.body.email;

  User.findByIdAndUpdate(id, { email: email })
    .then(student => { res.redirect('/admin/students') })
    .catch(err => { console.log(err) })
})

//make sure requests are sorted by timestamp
function enrollmentSuggestion(requests, courses) {
  const suggestion = {}; //empty suggestion object
  const waitlist = [];
  for (let i = 0; i < courses.length; i++) { //iterates through courses
    let tempCourse = { id: courses[i]._id, students: [], capacity: courses[i].capacity }; //copies course info 
    let name = courses[i].name
    suggestion[name] = tempCourse; //suggestion is now an object with course name as key, course info as value 
  }
  for (let i = 0; i < requests.length; i++) { //iterates through students
    let request = requests[i];
    let enrolled = false;
    console.log("enrolling", request._user.name)
    for (let j = 0; j < request._preferences.length; j++) { //iterates through preferences
      if (request._preferences[j] != '') {
        let course = request._preferences[j]; //course is the current preference 
        let courseCopy = suggestion[course.name]; //copy of the current preference (to not alter real course)
        console.log("checking", course.name)
        console.log("Course:", course, "courseCopy", courseCopy)
        if (courseCopy.students.length < courseCopy.capacity) {
          courseCopy.students.push(request._user)
          console.log("student added", request._user, course.name)
          console.log("COURSE COPY:", courseCopy, "SUGGESTION", suggestion[j])
          enrolled = true;
          break;
        }
        else console.log("no space in", course.name)
      }
    }
    if (enrolled == false) {
    console.log("add to waitlist")
    waitlist.push(request._user);
    }
  }
  return [suggestion, waitlist];

}

router.get('/manage', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  Request.find()
    .populate('_user', 'name')
    .populate('_preferences', 'name')
    .then(requests => {
      Course.find({ status: "FUTURE" })
        .then(courses => {
          res.render('admin/manage', { requests: requests, courses: courses })
        })
        .catch(err => { console.log(err) })
    })
    .catch(err => { console.log(err) })
})

router.post('/generate-enrollment', (req, res, next) => {
  Request.find()
    .populate('_user', 'name')
    .populate('_preferences', 'name')
    .then(requests => {
      Course.find({ status: "FUTURE" })
        .then(courses => {
          let suggestion = enrollmentSuggestion(requests, courses);
          console.log("suggestion:", suggestion)
          res.render('admin/manage', { requests: requests, courses: courses, suggestion: suggestion[0], waitlist: suggestion[1] })
        })
        .catch(err => { console.log(err) })
    })
    .catch(err => { console.log(err) })
})

router.post('/enroll', (req, res, next) => {
  console.log(req.body);
})




module.exports = router;