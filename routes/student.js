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

let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD
  }
});

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

router.get('/', (req, res, next) => {
  res.render('student/studentPage')
})
router.get('/postStudent', ensureAuthenticated, checkRole("STUDENT"), (req, res, next) => {
  res.render('student/postStudent')
})

router.post('/postStudent', ensureAuthenticated, checkRole("STUDENT"), uploadCloud.single('photo'), (req, res, next) => {
  const header = req.body.title;
  const content = req.body.text;
  const creatorName = req.user.name;
  const creatorId = req.user._id;
  if(req.file) {
    const imgurl = req.file.url;
    const imgName = req.file.originalname;
    const newPost = new Post({
      header: header,
      content: content,
      imgPath: imgurl,
      imgName: imgName,
      _creator: creatorId,
      status: "PENDING"
    })
    newPost.save()
    .then(post => {
      transporter.sendMail({
        from: '"Elviras Naehspass Website"',
        to: "elvirasnaehspass@gmail.com",
        subject: "A new post request on the website",
        text: content,
        html: `<h1>The requested post:</h1><hr><img src="${imgurl}" alt="${imgName}" height="300px"><p>${imgName}</p><h3>${header}</h3><p>${content}</p><p><i>by: ${creatorName}</i></p><br><hr><br><b><a href="https://naehspass.herokuapp.com/admin/confirmPost/${post._id}">Click here to accept and add the post</a></b>`
      })
        .then(info => res.render('student/successPost'))
        .catch(error => console.log(error));
    })
    .catch(err => {
      console.log(err)
    })
  } else {
    const newPost = new Post({
      header: header,
      content: content,
      _creator: creatorId,
      status: "PENDING"
    })
    newPost.save()
    .then(post => {
      transporter.sendMail({
        from: '"Elviras Naehspass Website"',
        to: "elvirasnaehspass@gmail.com",
        subject: "A new post request on the website",
        text: content,
        html: `<h1>The requested post:</h1><hr><h3>${header}</h3><p>${content}</p><p><i>by: ${creatorName}</i></p><br><hr><br><b><a href="http://localhost:3000/admin/confirmPost/${post._id}">Click here to accept and add the post</a></b>`
      })
        .then(info => res.render('student/successPost'))
        .catch(error => console.log(error));
    })
    .catch(err => {
      console.log(err)
    })
  }
})

router.get('/myCourse', ensureAuthenticated, checkRole("STUDENT"), (req, res, next) => {
  Promise.all([Course.find({ _students: { $in: req.user._id }, type: "COURSE" }), Course.find({ _students: { $in: req.user._id }, type: "WORKSHOP" })])
    .then(([courses, workshops]) => {
      res.render('student/myCourse', { course: courses, workshop: workshops })
    })
    .catch(err => { console.log(err) })
})

router.get('/myProfile', ensureAuthenticated, checkRole("STUDENT"), (req, res, next) => {
  res.render('student/myProfile', { user: req.user })
})

router.post('/myProfile/changePassword', ensureAuthenticated, checkRole("STUDENT"), (req, res, next) => {
  let id = req.user._id;
  const oldPassw = req.body.oldPassw;
  if (!bcrypt.compareSync(oldPassw, req.user.password)) {
    res.render('student/myProfile', { message: "Incorrect Password!", user: req.user })
    return;
  }

  const newPassw1 = req.body.newPassw1;
  const newPassw2 = req.body.newPassw2;

  if (newPassw1 === newPassw2) {
    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(newPassw1, salt);
    User.findByIdAndUpdate(id, {
      password: hashPass
    })
      .then(sth => { res.render('student/myProfile', { message: "Password sucessfully changed!", user: req.user }) })
      .catch(err => { console.log(err) })
  }
  else {
    res.render('student/myProfile', { message: "The new Password was not the same", user: req.user })
  }
})



module.exports = router;