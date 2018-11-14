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
const bcrypt = require('bcrypt');
const bcryptSalt = 10;

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

let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD
  }
});

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
  const description = req.body.description;
  const startDate = req.body.startDate;

  const newCourse = new Course({
    name: name,
    teacher: teacher,
    capacity: capacity,
    status: "FUTURE",
    type: type,
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
  const startDate = req.body.startDate;

  Course.findByIdAndUpdate(id, {
    name: name,
    teacher: teacher,
    capacity: capacity,
    description: description,
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
  const allStudents = []; //to use for autofill tags 
  for (let i = 0; i < courses.length; i++) { //iterates through courses
    let tempCourse = { id: courses[i]._id, students: [], capacity: courses[i].capacity }; //creates copy of course  
    suggestion[courses[i].name] = tempCourse; //suggestion is now an object with course name as key, course info as value 
  }
  for (let i = 0; i < requests.length; i++) { //iterates through students
    let request = requests[i];
    let enrolled = false;
    let student = { name: request._user.name, id: request._user._id }; //student object with name and id values 
    allStudents.push({ name: student.name, id: student.id }); //adds student object to array of all students 
    for (let j = 0; j < request._preferences.length; j++) { //iterates through preferences
      if (request._preferences[j] != '') {
        let course = request._preferences[j]; //course is the current preference 
        let courseCopy = suggestion[course.name]; //copy of the current preference (to not alter real course)
        if (courseCopy.students.length < courseCopy.capacity) {
          courseCopy.students.push(student)
          enrolled = true;
          break;
        }
      }
    }
    if (enrolled == false) {
      waitlist.push(request._user);
    }
  }
  return [suggestion, waitlist, allStudents];

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
          res.render('admin/manage', { requests: requests, courses: courses, suggestion: suggestion[0], waitlist: suggestion[1], allStudents: suggestion[2] })
        })
        .catch(err => { console.log(err) })
    })
    .catch(err => { console.log(err) })
})

router.post('/enroll', (req, res, next) => {
  console.log("req body", req.body)
  console.log("keys", Object.keys(req.body))
  Object.keys(req.body).forEach(function(key) {
    console.log("values", req.body[key]);
  });
  console.log(req.body['5beaf62a52ddac4105f323f8']);
//   let courseid = req.params.id;
//   const courseidfrombody = Object.keys(req.body) //das gleiche wir courseid(ein String)
//   const studentArray = Object.values(req.body) //[array mit "name", "id"]
//   const studentIdArray = []  // am Ende ein array mit allen Student Ids
//   for (i = 1; i < studentArray.length; i + 2) {
//     studentIdArray.push(studentArray[i])
//   };
//   console.log(studentIdArray)

//   Course.findByIdAndUpdate(courseidfrombody, { status: "ACTIVE", _students: studentIdArray })
//     .then(course => {
//       studentIdArray.forEach(studentid => {
//         User.findById(studentid)
//           .then(student => {
//             if (student.status == "ACTIVE") {
//               //Code for what happens to active students
//               //Confirmation email
//               var mailOptions = {
//                 to: student.email,
//                 from: '"Elviras Nähspass Website"',
//                 subject: 'You entered a course!',
//                 text: 'You are receiving this because you have signed up for a course!\n\n' +
//                   'You have sucessfully entered the course:' + course.name + '\n\n' +
//                   'The course starts on' + course.startDate + '\n\n' +
//                   "If you have any questions, don't hesitate to contact us!\n"
//               };
//               transporter.sendMail(mailOptions)

//             } else if (student.status == "PENDING") {
//               //Code what happens to pending students
//               //Confirmation email
//               var mailOptions = {
//                 to: student.email,
//                 from: '"Elviras Nähspass Website"',
//                 subject: 'You entered a course!',
//                 text: 'You are receiving this because you have signed up for a course!\n\n' +
//                   'You have sucessfully entered the course:' + course.name + '\n\n' +
//                   'The course starts on' + course.startDate + '\n\n' +
//                   'If you have any questions, don\'t hesitate to contact us!\n\n' +
//                   'You will soon receive an email, with all your login information for the webiste!\n'
//               };
//               transporter.sendMail(mailOptions)
//               //Login info email
//               var pwdChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
//               var pwdLen = 10;
//               var randPassword = Array(pwdLen).fill(pwdChars).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
//               const salt = bcrypt.genSaltSync(bcryptSalt);
//               const hashPass = bcrypt.hashSync(randPassword, salt);

//               User.findByIdAndUpdate(studentid, { status: "ACTIVE", password: hashPass })
//                 .then(user => { console.log(user) })
//                 .catch(err => { console.log(err) })

//               var mailOptions = {
//                 to: student.email,
//                 from: '"Elviras Nähspass Website"',
//                 subject: 'Your login information!',
//                 text: 'You have successfully entered a course, and here comes you login information!\n\n' +
//                   'From now on, you can login in on our website, and view your course information.\n\n' +
//                   'Here you can find all dates, and see on what day you can skip. You are not able to edit anything on the course.\n\n' +
//                   'If you want to a skip one day, please contact us.\n\n' +
//                   'On the website, you can also post things! If you have sewed something, or you just have some experience to share, we would be really grateful, if you post something!\n\n' +
//                   'As soon, as you post is confirmed by one Admin, it will appear on the home page!\n\n' +
//                   'This is your login information:\n\n' +
//                   'Your email:' + student.email + '\n\n' +
//                   'Your temporary password:' + randPassword + '\n\n' +
//                   'You can change your password on your profile page. Please do that as soon as possible!\n'
//               };
//               transporter.sendMail(mailOptions)
//             }
//           })
//           .catch(err => { console.log(err) })
//       })
//     })
//     .then(course => {
//       studentIdArray.forEach(studentid => {
//         Request.findOneAndDelete({ _user: studentid })
//           .then(sth => { console.log(sth) })
//           .catch(err => { console.log(err) })
//       })
//     })
//     .then(sth => { res.send(sth) })
//     .catch(err => { console.log(err) })
})

  const courseidfrombody = Object.keys(req.body) //ein Array mit allen Course ids

  courseidfrombody.forEach(courseid => {
    const studentArray = req.body[courseid]
    const studentIdArray = [] // am Ende ein array mit allen Student Ids
    if (typeof studentArray == "string") {
      var studentArrayarray = []
      studentArrayarray.push(studentArray)
      studentArrayarray.forEach(str => {
        var input = str.split(", ")
        studentIdArray.push(input[1])
      })
    } else {
      studentArray.forEach(str => {
        var input = str.split(", ")
        studentIdArray.push(input[1])
      })
    }

    Course.findByIdAndUpdate(courseid, { status: "ACTIVE", _students: studentIdArray })
      .then(course => {
        studentIdArray.forEach(studentid => {
          User.findById(studentid)
            .then(student => {
              if (student.status == "ACTIVE") {
                //Code for what happens to active students
                //Confirmation email
                var mailOptions = {
                  to: student.email,
                  from: '"Elviras Nähspass Website"',
                  subject: 'You entered a course!',
                  text: 'You are receiving this because you have signed up for a course!\n\n' +
                    'You have sucessfully entered the course:' + course.name + '\n\n' +
                    'The course starts on ' + course.startDate + '\n\n' +
                    "If you have any questions, don't hesitate to contact us!\n"
                };
                transporter.sendMail(mailOptions)

              } else if (student.status == "PENDING") {
                //Code what happens to pending students
                //Confirmation email
                var mailOptions = {
                  to: student.email,
                  from: '"Elviras Nähspass Website"',
                  subject: 'You entered a course!',
                  text: 'You are receiving this because you have signed up for a course!\n\n' +
                    'You have sucessfully entered the course:' + course.name + '\n\n' +
                    'The course starts on ' + course.startDate + '\n\n' +
                    'If you have any questions, don\'t hesitate to contact us!\n\n' +
                    'You will soon receive an email, with all your login information for the webiste!\n'
                };
                transporter.sendMail(mailOptions)
                //Login info email
                var pwdChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
                var pwdLen = 10;
                var randPassword = Array(pwdLen).fill(pwdChars).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
                const salt = bcrypt.genSaltSync(bcryptSalt);
                const hashPass = bcrypt.hashSync(randPassword, salt);

                User.findByIdAndUpdate(studentid, { status: "ACTIVE", password: hashPass })
                  .then(user => { console.log(user) })
                  .catch(err => { console.log(err) })

                var mailOptions = {
                  to: student.email,
                  from: '"Elviras Nähspass Website"',
                  subject: 'Your login information!',
                  text: 'You have successfully entered a course, and here comes you login information!\n\n' +
                    'From now on, you can login in on our website, and view your course information.\n\n' +
                    'Here you can find all dates, and see on what day you can skip. You are not able to edit anything on the course.\n\n' +
                    'If you want to a skip one day, please contact us.\n\n' +
                    'On the website, you can also post things! If you have sewed something, or you just have some experience to share, we would be really grateful, if you post something!\n\n' +
                    'As soon, as you post is confirmed by one Admin, it will appear on the home page!\n\n' +
                    'This is your login information:\n\n' +
                    'Your email:' + student.email + '\n\n' +
                    'Your temporary password:' + randPassword + '\n\n' +
                    'You can change your password on your profile page. Please do that as soon as possible!\n'
                };
                transporter.sendMail(mailOptions)
              }
            })
            .catch(err => { console.log(err) })
        })
      })
      .then(course => {
        studentIdArray.forEach(studentid => {
          Request.findOneAndDelete({ _user: studentid })
            .then(sth => { console.log(sth) })
            .catch(err => { console.log(err) })
        })
      })
      .then(sth => { res.next() })
      .catch(err => { console.log(err) })
  });
  res.redirect('/admin/manage')



module.exports = router;