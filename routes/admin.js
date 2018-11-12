const express = require('express');
const router = express.Router();
const Post = require('../models/Post')
const Course = require('../models/Course')
const User = require('../models/User')

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

router.post('/postAdmin', ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  const content = req.body.text;
  const header = req.body.title;
  const creatorId = req.user._id;
  const newPost = new Post({
    header: header,
    content: content,
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