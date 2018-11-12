const express = require('express');
const router = express.Router();
const Post = require('../models/Post')
const Course = require('../models/Course')
const User = require('../models/User')
const multer = require('multer');
const uploadCloud = require('../config/cloudinary.js');

/* GET home page */
router.get('/', (req, res, next) => {
  Post.find(null, null, { sort: { created_at: -1 }, limit: 10 })
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

router.get('/atelier', (req, res, next) => {
  res.render('atelier')
})

router.get('/about', (req, res, next) => {
  res.render('about')
})

router.get('/galerie', (req, res, next) => {
  res.render('galerie')
})

router.get('/anmeldung', (req, res, next) => {
  res.render('anmeldung')
})

router.get('/contact', (req, res, next) => {
  res.render('contact')
})

router.get('/noAccess', (req, res, next) => {
  res.render('noAccess')
})

module.exports = router;
