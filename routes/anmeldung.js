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


let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD
  }
});


router.get('/', (req, res, next) => {
  res.render('anmeldung')
})

router.get('/kurse', (req, res, next) => {
  if (req.user) {
    Promise.all([Course.find({ status: "FUTURE", type: "COURSE" }), User.findById(req.user._id)])
      .then(([courses, user]) => {
        res.render('anmeldung-kurse', { courses: courses, user: user })
      })
      .catch(err => { console.log(err) })
  } else {
    Course.find({ status: "FUTURE", type: "COURSE" })
      .then(courses => {
        res.render('anmeldung-kurse', { courses: courses })
      })
      .catch(err => { console.log(err) })
  }
})

router.post('/kurse', (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const phone = req.body.phone;
  const adress = req.body.adress;
  const message = req.body.message;
  const preferences = [];

  if (req.body.choice1 != '') {
    preferences.push(req.body.choice1);
  }
  if (req.body.choice2 != '') {
    preferences.push(req.body.choice2);
  }
  if (req.body.choice3 != '') {
    preferences.push(req.body.choice3);
  }

  if (name === "" || phone === "" || email === "") {
    res.render("anmeldung-kurse", { message: "Indicate username, email and phone" });
    return;
  }

  transporter.sendMail({
    from: '"Elviras Naehspass Website"',
    to: "elvirasnaehspass@gmail.com",
    subject: "A new course request on the website",
    text: message,
    html: `<h1>The requested course:</h1><hr><p>${name} requested to join:<br>Choice 1:${preferences[0]}<br>Choice 2:${preferences[1]}<br>Choice 3:${preferences[2]}</p><p>He/She put this extra message:${message}</p><br><hr><br>`
  })
    .then(sth => {
      User.find({ email: email })
        .then(user => {
          if (user[0]) {
            const newRequest = new Request({
              _user: user[0]._id,
              preferences: preferences,
            })
            newRequest.save()
              .then(sth => { res.render('registration-success') })
              .catch(err => { res.render('registration-failed'), console.log(err) })
          }
          else {
            const newUser = new User({
              name: name,
              email: email,
              role: "STUDENT",
              status: "PENDING",
              address: adress,
              phone: phone,
            })
            newUser.save()
              .then(user2 => {
                const newRequest = new Request({
                  _user: user2._id,
                  _preferences: preferences,
                })
                newRequest.save()
                  .then(sth => { res.render('registration-success') })
                  .catch(err => { res.render('registration-failed'), console.log(err) })
              })
              .catch(err => { res.render('registration-failed'), console.log(err) })
          }
        })
        .catch(err => { res.render('registration-failed'), console.log(err) })
    })
    .catch(error => console.log(error));
})

router.get('/workshops', (req, res, next) => {
  if (req.user) {
    Promise.all([Course.find({ type: "WORKSHOP" }), User.findById(req.user._id)])
      .then(([workshops, user]) => {
        res.render('anmeldung-workshop', { workshops: workshops, user: user })
      })
      .catch(err => { console.log(err) })
  } else {
    Course.find({ type: "WORKSHOP" })
      .then(workshops => {
        res.render('anmeldung-workshop', { workshops: workshops })
      })
      .catch(err => { console.log(err) })
  }
})

router.post('/workshops', (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const phone = req.body.phone;
  const adress = req.body.adress;
  const message = req.body.message;
  const workshop = req.body.workshop;

  if (name === "" || phone === "" || email === "") {
    res.render("anmeldung-workshops", { message: "Indicate username, email and phone" });
    return;
  }

  transporter.sendMail({
    from: '"Elviras Naehspass Website"',
    to: "elvirasnaehspass@gmail.com",
    subject: "A new workshop request on the website",
    text: message,
    html: `<h1>The requested workshop:</h1><hr><p>${name} requested to join ${workshop}</p><p>He/She put this extra message:${message}</p><br><hr><br>`
  })
    .then(sth => {
      User.find({ email: email })
        .then(user => {
          if (user !== "") {
            res.render('registration-success')
          }
          else {

            const newUser = new User({
              name: name,
              email: email,
              role: "STUDENT",
              status: "PENDING",
              address: adress,
              phone: phone,
            })
            newUser.save()
              .then(sth => { res.render('registration-success') })
              .catch(err => { res.render('registration-failed') })
          }
        })
        .catch(err => { res.render('registration-failed') })
    })
    .catch(error => console.log(error));
})

module.exports = router;