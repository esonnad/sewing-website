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

router.get('/postStudent', ensureAuthenticated, checkRole("STUDENT"), (req, res, next) => {
  res.render('student/postStudent')
})

router.get('/myCourse', ensureAuthenticated, checkRole("STUDENT"), (req, res, next) => {
  res.render('student/myCourse')
})

router.get('/myProfile', ensureAuthenticated, checkRole("STUDENT"), (req, res, next) => {
  res.render('student/myProfile', { user: req.user })
})

module.exports = router;