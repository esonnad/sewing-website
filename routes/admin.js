const express = require('express');
const router = express.Router();
const Post = require('../models/Post')
const Course = require('../models/Course')
const User = require('../models/User')
const multer = require('multer');
const uploadCloud = require('../config/cloudinary.js');

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

router.get('/postAdmin', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  res.render('admin/postAdmin')
})

const upload = multer({ dest: './public/uploads/' });

router.post('/postAdmin', ensureAuthenticated, checkRole("ADMIN"), uploadCloud.single('photo'), (req, res, next) => {
  const content = req.body.text;
  const header = req.body.title;
  const creatorId = req.user._id;

  const newPost = new Post({
    header: header,
    content: content,
    imgPath: req.file.url,
    imgName: req.file.originalname,
    _creator: creatorId
  })
  newPost.save()
    .then(() => {
      res.redirect('/')
    })
    .catch(err => {
      console.log(err)
    })
})

module.exports = router;