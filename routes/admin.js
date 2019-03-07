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
const Hogan = require('hogan.js');
const fs = require('fs');
var template = fs.readFileSync('./views/email.hbs', 'utf-8')
var compiledTemplate = Hogan.compile(template);

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

//Posts
router.get('/allPosts', ensureAuthenticated, checkRole("ADMIN"), (req,res,next)=>{
  Promise.all([Post.find({ status: "ACTIVE" }, null, { sort: { created_at: -1 }}).populate('_creator'), Post.find({ status: "PENDING" }, null, { sort: { created_at: -1 }}).populate('_creator')])
    .then(([activePosts, pendingPosts]) => {
      res.render('admin/allposts', {activePosts: activePosts, pendingPosts:pendingPosts});
    })
    .catch(err => { console.log(err) })
})

router.get('/allPosts/delete/:id', ensureAuthenticated, checkRole("ADMIN"), (req,res,next)=>{
  let id = req.params.id;

  Post.findByIdAndRemove(id)
    .then(sth => {
      res.redirect('/admin/allPosts')
    })
    .catch(err => { console.log(err) })
})

router.get('/allPosts/edit/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;
  Post.findById(id)
    .then(post => {
      res.render('admin/post-edit', {post:post})
    })
    .catch(err => { console.log(err) })
})

router.post('/allPosts/editinfo/:id', ensureAuthenticated, checkRole("ADMIN"), (req,res,next)=> {
  let id = req.params.id;
  let header = req.body.header;
  let content = req.body.content;

  Post.findByIdAndUpdate(id, {header: header, content: content})
    .then(sth => res.redirect('/admin/allPosts'))
    .catch(err => console.log(err))
})

router.post('/allPosts/editfile/:id', ensureAuthenticated, checkRole("ADMIN"), uploadCloud.single('photo'), (req,res,next)=> {
  let id = req.params.id;
  Post.findByIdAndUpdate(id, {imgPath: req.file.url, imgName: req.file.originalname})
    .then(sth => res.redirect('/admin/allPosts'))
    .catch(err => console.log(err))
})

router.get('/postAdmin', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  res.render('admin/postAdmin')
})

router.post('/postAdmin', ensureAuthenticated, checkRole("ADMIN"), uploadCloud.single('photo'), (req, res, next) => {
  const content = req.body.text;
  const header = req.body.title;
  const creatorId = req.user._id;
  if(content === "" && header === "") {
    res.render("admin/postAdmin", {message: "Es muss entweder ein Titel oder ein Text gegeben sein!"});
    return;
  }
  if(req.file) {
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
  } else {
    const newPost = new Post({
      header: header,
      content: content,
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
  }
})

router.get('/confirmPost/:id', (req, res, next) => {
  let id = req.params.id;
  Post.findByIdAndUpdate(id, { status: "ACTIVE" })
    .then(post => {
      res.render("admin/confirmed-post")
    })
    .catch(err => { console.log(err), res.render("admin/confirmed-failed") })
})

//Equipment pages
router.get('/equipment', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  Equipment.find(null, null, { sort: { created_at: -1 }})
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
  if(content === "" && header === "") {
    res.render('admin/newEquipment', {message: "Titel oder Beschreibung muss ausgefüllt sein"})
    return;
  }
  if(req.file){
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
  } else {
    const newEquipment = new Equipment({
      header: header,
      content: content,
    })
    newEquipment.save()
      .then(() => {
        res.redirect('/admin/equipment')
      })
      .catch(err => { console.log(err) })
  }
})

router.get('/equipment/delete/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;

  Equipment.findByIdAndRemove(id)
    .then(sth => {
      res.redirect('/admin/equipment')
    })
    .catch(err => { console.log(err) })
})

router.get('/equipment/edit/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;
  Equipment.findById(id)
    .then(equipment => {
      res.render('admin/equipment-edit', {equipment:equipment})
    })
    .catch(err => { console.log(err) })
})

router.post('/equipment/editinfo/:id', ensureAuthenticated, checkRole("ADMIN"), (req,res,next)=> {
  let id = req.params.id;
  let header = req.body.header;
  let content = req.body.content;

  Equipment.findByIdAndUpdate(id, {header: header, content: content})
    .then(sth => res.redirect('/admin/equipment'))
    .catch(err => console.log(err))
})

router.post('/equipment/editfile/:id', ensureAuthenticated, checkRole("ADMIN"), uploadCloud.single('photo'), (req,res,next)=> {
  let id = req.params.id;
  Equipment.findByIdAndUpdate(id, {imgPath: req.file.url, imgName: req.file.originalname})
    .then(sth => res.redirect('/admin/equipment'))
    .catch(err => console.log(err))
})

//Courses pages
router.get('/courses', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  if(Course.find()===[]){
      res.render("admin/allCourses")
    } 
    else if(Course.find({ type: "COURSE", status: "ACTIVE" })===[]||Course.find({ type: "COURSE", status: "FUTURE" })===[]) {
      Course.find({ type: "WORKSHOP" }).populate("_students")
      .then(([workshops]) => {
      res.render('admin/allCourses', {
        workshops: workshops,
      })
      })
      .catch(err => { console.log(err) })
    } else if(Course.find({ type: "WORKSHOP" })===[]|| Course.find({ type: "COURSE", status: "ACTIVE" })===[]){
      Course.find({ type: "COURSE", status: "FUTURE" })
      .populate("_students")
      .then(([futureCourses]) => {
      res.render('admin/allCourses', {
        futureCourses: futureCourses,
      })
      })
      .catch(err => { console.log(err) })
    } else if(Course.find({ type: "WORKSHOP" })===[]|| Course.find({ type: "COURSE", status: "FUTURE" })===[]){
      Course.find({ type: "COURSE", status: "ACTIVE" })
      .populate("_students")
      .then(([activeCourses]) => {
      res.render('admin/allCourses', {
        activeCourses: activeCourses,
      })
      })
      .catch(err => { console.log(err) })
    }
    else if(Course.find({ type: "WORKSHOP" })===[]){
      Promise.all([Course.find({ type: "COURSE", status: "ACTIVE" }).populate("_students"), Course.find({ type: "COURSE", status: "FUTURE" }).populate("_students")])
      .then(([activeCourses, futureCourses]) => {
        res.render('admin/allCourses', {
          futureCourses: futureCourses,
          activeCourses: activeCourses,
        })
      })
      .catch(err => { console.log(err) })
    }
    else if (Course.find({ type: "COURSE", status: "ACTIVE" })===[]){
      Promise.all([Course.find({ type: "WORKSHOP" }).populate("_students"), Course.find({ type: "COURSE", status: "FUTURE" }).populate("_students")])
    .then(([workshops, futureCourses]) => {
      res.render('admin/allCourses', {
        workshops: workshops,
        futureCourses: futureCourses,
      })
    })
    .catch(err => { console.log(err) })
    }
    else if (Course.find({ type: "COURSE", status: "FUTURE" })===[]){
      Promise.all([Course.find({ type: "WORKSHOP" }).populate("_students"), Course.find({ type: "COURSE", status: "ACTIVE" }).populate("_students")])
      .then(([workshops, activeCourses, futureCourses]) => {
        res.render('admin/allCourses', {
          workshops: workshops,
          activeCourses: activeCourses,
        })
      })
      .catch(err => { console.log(err) })
    } else {
  Promise.all([Course.find({ type: "WORKSHOP" }).populate("_students"), Course.find({ type: "COURSE", status: "ACTIVE" }).populate("_students"), Course.find({ type: "COURSE", status: "FUTURE" }).populate("_students")])
    .then(([workshops, activeCourses, futureCourses]) => {
      res.render('admin/allCourses', {
        workshops: workshops,
        futureCourses: futureCourses,
        activeCourses: activeCourses,
      })
    })
    .catch(err => { console.log(err) })
  }
})

router.get('/courses/add', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  res.render('admin/add-course')
})
router.post('/courses/add', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  const name = req.body.name;
  const teacher = req.body.teacher;
  const capacity = Number(req.body.capacity);
  const type = req.body.type;
  const description = req.body.description;
  const startDate = req.body.startDate;
  console.log(typeof(capacity))
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

router.get('/courses/details/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;
  Course.findById(id)
    .populate('_students')
    .then(course => {
      if (course.type === "COURSE") {
        res.render('admin/course-detail', { course: course, type: course })
      } else {
        res.render('admin/course-detail', { course: course })
      }
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
router.post('/courses/details/:id/add-student', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;
  const student = req.body.student;
  Course.findByIdAndUpdate(id, { $push: { _students: student } })
    .then(sth => { res.redirect(`/admin/courses/details/${id}/edit`) })
    .catch(err => { console.log(err) })
})
router.get('/courses/details/:courseid/remove-student/:studentid', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let studentid = req.params.studentid;
  let courseid = req.params.courseid;
  Course.findByIdAndUpdate(courseid, { $pull: { _students: studentid } })
    .then(sth => { res.redirect(`/admin/courses/details/${courseid}/edit`) })
    .catch(err => { console.log(err) })
})
router.post('/courses/details/:id/add-date', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;
  const date = req.body.date;
  if (date !== "") {
    Course.findByIdAndUpdate(id, { $push: { dates: { date: date, skip: [] } } })
      .then(sth => { res.redirect(`/admin/courses/details/${id}/edit`) })
      .catch(err => { console.log(err) })
  }
  else {
    res.redirect(`/admin/courses/details/${id}`)
  }
})
router.get('/courses/details/:courseid/remove-date/:date', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
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
router.get('/courses/details/:id/editSkip', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;
  Course.findById(id)
    .populate('_students')
    .then(course => {
      res.render('admin/course-skip', { course: course })
    })
    .catch(err => { console.log(err) })
})
router.post('/courses/details/:id/editSkip', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;
  console.log(req.body)
  var placeofplaceholders=[]
  req.body.names.forEach((val,i)=>{
    if(val==="placeholder"){
      placeofplaceholders.push(i)
    }
  })
  placeofplaceholders.push(req.body.names.length)

  Course.findById(id)
  .then(course => {
    const dates = course.dates
    console.log(dates)
    const newArray = []
    for (i = 0; i < dates.length; i++) {
        var thisdate = dates[i].date
        var startslice = placeofplaceholders[i]
        var endslice = placeofplaceholders[i+1]
        var thissplit = req.body.names.slice(startslice,endslice)
        var thisskip = thissplit.slice(1)
        newArray.push({ date: thisdate, skip: thisskip })
      }
      Course.findByIdAndUpdate(id, { dates: newArray })
        .then(sth => { res.redirect(`/admin/courses/details/${id}`) })
        .catch(err => { console.log(err) })
    })
    .catch(err => { console.log(err) })
})

router.get('/courses/delete/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;

  Course.findByIdAndRemove(id)
    .then(sth => {
      res.redirect('/admin/courses')
    })
})

//Students pages
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
    .catch(er => { console.log(er) })
})

router.get('/students/edit/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;

  User.findById(id)
    .then(student => { res.render('admin/student-detail', { student: student }) })
    .catch(err => { console.log(err) })
})

router.post('/students/edit/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;
  const email = req.body.email;
  const name = req.body.name;
  const adress = req.body.adress;
  const phone = req.body.phone;

  User.findByIdAndUpdate(id, { name:name, email: email, adress: adress, phone: phone, })
    .then(student => { res.redirect('/admin/students') })
    .catch(err => { console.log(err) })
})

router.get('/students/activate/:id', ensureAuthenticated, checkRole("ADMIN"), (req,res,next)=>{
  let id = req.params.id;

  var pwdChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var pwdLen = 10;
  var randPassword = Array(pwdLen).fill(pwdChars).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
  const salt = bcrypt.genSaltSync(bcryptSalt);
  const hashPass = bcrypt.hashSync(randPassword, salt);

  User.findByIdAndUpdate(id, { status: "ACTIVE", password: hashPass })
    .then(user => { 
      var mailOptions = {
      to: user.email,
      from: '"Elviras Nähspass Website"',
      subject: 'Deine Login Informationen!!',
      text: 'Ein Admin hat deinen Account aktiviert, hier kommt deine Login Info!\n\n' +
        'Ab jetzt kannst du dich auf der Website einloggen, und Informationen über deinen Kurs erhalten, solltest du einem beigetreten sein.\n\n' +
        'Du findest dort alle Daten, und kannst sehen, wann jemand aussetzt. Du kannst den Kalender nicht bearbeiten!\n\n' +
        'Wenn du an einem Tag aussetzen möchtest, dann kontaktiere uns bitte.\n\n' +
        'Auf der Website kannst du ebenfalls Sachen posten! Die Sachen erscheinen dann, nachdem ein Administartor sie genehmigt hat, auf der Start Seite!\n\n' +
        'Hier ist deine Login information:\n\n' +
        'Deine Email: ' + user.email + '\n\n' +
        'Dein vorläufiges Passwort: ' + randPassword + '\n\n' +
        'Auf deiner Profilseite kannst du dein Passwort ändern, bitte mache das so bald wie möglich!\n'
    };
    transporter.sendMail(mailOptions);
    res.redirect('/admin/students') })
    .catch(err => { console.log(err) })
})



//Enrollment functions
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
    var student;
    console.log(request._share)
    if(request._share){
      student = { name: request._user.name+"/"+request._share.name, id: request._user._id+"/"+request._share.id }; //student object with name and id values 
    } else {
      student = { name: request._user.name, id: request._user._id }; //student object with name and id values 
    }
    
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
      if(request._share){
        waitlist.push((request._share))
      }
    }
  }
  return [suggestion, waitlist, allStudents];
}

router.get('/manage', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  Request.find()
    .populate('_user', 'name')
    .populate('_share', 'name')
    .populate('_preferences', 'name')
    .then(requests => {
      Course.find({ status: "FUTURE", type: "COURSE" })
        .then(courses => {
          res.render('admin/manage', { requests: requests, courses: courses })
        })
        .catch(err => { console.log(err) })
    })
    .catch(err => { console.log(err) })
})

router.post('/request/delete/:id', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  let id = req.params.id;
  Request.findByIdAndDelete(id)
    .then(
      res.redirect('/admin/manage')
    )
    .catch(err => { console.log(err) })
})

router.post('/generate-enrollment', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  Request.find()
    .populate('_user', 'name')
    .populate('_preferences', 'name')
    .populate('_share', 'name')
    .then(requests => {
      Course.find({ status: "FUTURE", type: "COURSE"})
        .then(courses => {
          let suggestion = enrollmentSuggestion(requests, courses);
          console.log("suggestion:", suggestion)
          res.render('admin/manage', { requests: requests, courses: courses, suggestion: suggestion[0], waitlist: suggestion[1], allStudents: suggestion[2] })
        })
        .catch(err => { console.log(err) })
    })
    .catch(err => { console.log(err) })
})

router.post('/enroll', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  console.log("body", req.body)
  const courseidfrombody = Object.keys(req.body) //ein Array mit allen Course ids//in dem falle nur 1: 
  console.log("courseidFromBody", courseidfrombody)
  courseidfrombody.forEach(courseid => {
    const studentArray = req.body[courseid] //'Feli/elvira, 5c8171452f8721046138851d/5c8171452f8721046138851e'
    console.log(studentArray)
    const studentIdArray = [] // am Ende ein array mit allen Student Ids
    if (typeof studentArray == "string") {
      var studentArrayarray = []
      studentArrayarray.push(studentArray)
      studentArrayarray.forEach(str => {
        var input = str.split(", ")
        if(input[1].includes("/")){
          var inputsplit = input[1].split("/")
          studentIdArray.push(inputsplit[0])
          studentIdArray.push(inputsplit[1])
        } else {
          studentIdArray.push(input[1])
        }
      })
    } else {
      studentArray.forEach(str => {
        var input = str.split(", ")
        if(input[1].includes("/")){
          var inputsplit = input[1].split("/")
          studentIdArray.push(inputsplit[0])
          studentIdArray.push(inputsplit[1])
        } else {
          studentIdArray.push(input[1])
        }
      })
    }
    console.log(studentIdArray)//[ '5c8171452f8721046138851d', '5c8171452f8721046138851e' ]

    Course.findByIdAndUpdate(courseid, { status: "ACTIVE", _students: studentIdArray, capacity: studentIdArray.length })
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
                  subject: 'Du bist Teilnehmer in einem Kurs!',
                  text: 'Du bekommst diese Email, weil du dich für einen Kurs angemeldet hast!\n\n' +
                    'Du wurdest erfolgreich in diesem Kurs aufgenommen: ' + course.name + '\n\n' +
                    'Der Kurs beginnt am: ' + course.startDate + '\n\n' +
                    'Solltest du noch irgendwelche Fragen haben, kontaktiere uns gerne!\n\n'
                };
                transporter.sendMail(mailOptions)

              } else if (student.status == "PENDING") {
                //Code what happens to pending students
                //Confirmation email
                var mailOptions = {
                  to: student.email,
                  from: '"Elviras Nähspass Website"',
                  subject: 'Du bist Teilnehmer in einem Kurs!',
                  text: 'Du bekommst diese Email, weil du dich für einen Kurs angemeldet hast!\n\n' +
                    'Du wurdest erfolgreich in diesem Kurs aufgenommen: ' + course.name + '\n\n' +
                    'Der Kurs beginnt am: ' + course.startDate + '\n\n' +
                    'Solltest du noch irgendwelche Fragen haben, kontaktiere uns gerne!\n\n' +
                    'In kürze bekommst du noch eine Email mit deiner Login Information!\n'
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
                  subject: 'Deine Login Informationen!!',
                  text: 'Du bist erfolgreich einem Kurs beigetreten, hier kommt deine Login Info!\n\n' +
                    'Ab jetzt kannst du dich auf der website einloggen, und Informationen über deinen Kurs erhalten.\n\n' +
                    'Du findest dort alle Daten, und kannst sehen, wann jemand aussetzt. Du kannst den Kalender nicht bearbeiten!\n\n' +
                    'Wenn du an einem Tag aussetzen möchtest, dann kontaktiere uns bitte.\n\n' +
                    'Auf der Website kannst du ebenfalls Sachen posten! Die Sachen erscheinen dann, nachdem ein Administartor sie genehmigt hat, auf der Start Seite!\n\n' +
                    'Hier ist deine Login information:\n\n' +
                    'Deine Email: ' + student.email + '\n\n' +
                    'Dein vorläufiges Passwort: ' + randPassword + '\n\n' +
                    'Auf deiner Profilseite kannst du dein Passwort ändern, bitte mache das so bald wie möglich!\n'
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
      .then(sth => { res.next() }) // this looks odd.
      .catch(err => { console.log(err) })
  });
  // res.redirect('/admin/manage')
  setTimeout(function () {
    var allCourses = [] //array with all course objects and each with student objects
    courseidfrombody.forEach(id => {
      Course.findById(id)
        .populate('_students')
        .then(course => { allCourses.push(course) })
        .catch(err => { console.log(err) })
    })
    setTimeout(function(){
      console.log("settimeout", allCourses)
      var mailOptions = {
        to: 'elvirasnaehspass@gmail.com',
        from: '"Elviras Nähspass Website"',
        subject: 'The new course schedule',
        html: compiledTemplate.render({ allCourses: allCourses })
      };
      transporter.sendMail(mailOptions)
        .then(sth => {
          res.redirect('/admin/manage')
        })
        .catch(err => { console.log(err) })
    }, 2000)
  }, 1000);
});


module.exports = router;