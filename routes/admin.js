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
      console.log("workshops", workshops, "activeCourse", activeCourses, "futureCourse", futureCourses);
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
  console.log(req.body)
  const name = req.body.name;
  const teacher = req.body.teacher;
  const capacity = req.body.capacity;
  const type = req.body.type;
  const dates = req.body.date;
  const description = req.body.description;

  const newCourse = new Course({
    name: name,
    teacher: teacher,
    capacity: capacity,
    status: "FUTURE",
    type: type,
    dates: dates,
    description: description,
  })
  newCourse.save()
    .then(() => {
      res.redirect('/admin/courses')
    })
    .catch(err => { console.log(err) })
})

router.get('/courses/details/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;

  Course.findById(id)
    .then(course => {
      res.render('admin/course-detail', {
        course: course
      })
    })
})
router.post('/courses/details/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;


})

router.get('/courses/delete/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;

  Course.findByIdAndRemove(id)
    .then(sth => {
      res.redirect('/admin/courses')
    })
})

router.get('/students', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  res.render('admin/students')
})

router.get('/manage', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  res.render('admin/manage')
})

module.exports = router;