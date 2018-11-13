const express = require('express');
const router = express.Router();
const Post = require('../models/Post')
const Course = require('../models/Course')
const User = require('../models/User')
const Equipment = require('../models/Equipment')
const multer = require('multer');
const uploadCloud = require('../config/cloudinary.js');
const nodemailer = require('nodemailer')
const Request = require('../models/Request')

/* GET home page */
router.get('/', (req, res, next) => {
  Post.find({ status: "ACTIVE" }, null, { sort: { created_at: -1 }, limit: 10 })
    .populate('_creator')
    .then(posts => {
      res.render('index', { posts: posts });
    })
    .catch(err => { console.log(err) })
});

router.get('/seeAllPosts', (req, res, next) => {
  Post.find(null, null, { sort: { created_at: -1 } })
    .populate('_creator')
    .then(posts => {
      res.render('allPosts', { posts: posts });
    })
    .catch(err => { console.log(err) })
})

router.get('/naehkurse', (req, res, next) => {
  res.render('naehkurse')
})

router.get('/naehkurse/kurse', (req, res, next) => {
  Course.find({ status: "FUTURE", type: "COURSE" })
    .then(courses => {
      res.render('kurse', { courses: courses })
    })
    .catch(err => { console.log(err) })
})

router.get('/naehkurse/workshops', (req, res, next) => {
  Course.find({ type: "WORKSHOP" })
    .then(workshops => {
      res.render('workshops', { workshops: workshops })
    })
    .catch(err => { console.log(err) })
})

router.get('/atelier', (req, res, next) => {
  Equipment.find()
    .then(equipment => {
      res.render('atelier', { equipment: equipment })
    })
    .catch(err => {
      console.log(err)
    })
})

router.get('/about', (req, res, next) => {
  res.render('about')
})

router.get('/galerie', (req, res, next) => {
  res.render('galerie')
})

router.get('/contact', (req, res, next) => {
  res.render('contact')
})

router.get('/noAccess', (req, res, next) => {
  res.render('noAccess')
})

module.exports = router;
