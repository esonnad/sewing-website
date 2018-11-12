const express = require('express');
const router = express.Router();
const Post = require('../models/Post')
const Course = require('../models/Course')
const User = require('../models/User')
const multer = require('multer');
const uploadCloud = require('../config/cloudinary.js');
const nodemailer = require('nodemailer');

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

router.get('/postStudent', ensureAuthenticated, checkRole("STUDENT"), (req, res, next) => {
  res.render('student/postStudent')
})

router.post('/postStudent', ensureAuthenticated, checkRole("STUDENT"), uploadCloud.single('photo'), (req, res, next) => {
  const header = req.body.title;
  const content = req.body.text;
  const creatorId = req.user._id;
  const imgurl = req.file.url;
  const imgName = req.file.originalname;
  const creatorName = req.user.name;

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
        html: `<h1>The requested post:</h1><hr><img src="${imgurl}" alt="${imgName}" height="300px"><p>${imgName}</p><h3>${header}</h3><p>${content}</p><p><i>by: ${creatorName}</i></p><br><hr><br><b><a href="http://localhost:3000/admin/confirmPost/${post._id}">Click here to accept and add the post</a></b>`
      })
        .then(info => res.redirect('/'))
        .catch(error => console.log(error));
    })
    .catch(err => {
      console.log(err)
    })
})

router.get('/myCourse', ensureAuthenticated, checkRole("STUDENT"), (req, res, next) => {
  res.render('student/myCourse')
})

router.get('/myProfile', ensureAuthenticated, checkRole("STUDENT"), (req, res, next) => {
  res.render('student/myProfile', { user: req.user })
})



module.exports = router;