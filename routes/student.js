const express = require('express');
const router = express.Router();

router.get('/postStudent', (req, res, next) => {
  res.render('student/postStudent')
})

router.get('/myCourse', (req, res, next) => {
  res.render('student/myCourse')
})

router.get('/myProfile', (req, res, next) => {
  res.render('student/myProfile')
})

module.exports = router;