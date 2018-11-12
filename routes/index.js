const express = require('express');
const router = express.Router();

/* GET home page */
router.get('/', (req, res, next) => {
  res.render('index');
});

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

module.exports = router;
