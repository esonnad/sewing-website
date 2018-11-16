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
const async = require('async');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const bcryptSalt = 10;

let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD
  }
});

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
router.post('/contact', (req, res, next) => {
  if (req.body.name === "" || req.body.email === "") {
    res.render('contact', { message: "Name und Email müssen angegeben sein!" });
    return;
  }
  var mailOptions = {
    to: 'info@elviras-naehspass.de',
    from: '"Elviras Nähspass Website"',
    subject: 'Betreff: ' + req.body.subject,
    text: 'Jemand auf der neuen Webiste hat ein Kontaktformular geschickt!\n\n' +
      'Das Kontakformular wurde von ' + req.body.name + ' gesendet.\n\n' +
      'Email: ' + req.body.email + '\n\n' +
      'Die Nachricht: ' + req.body.message + '\n'
  };
  transporter.sendMail(mailOptions)
    .then(sth => res.render('contact', { message: "Das Kontakformular wurde gesendet!" }))
    .catch(err => { console.log(err) })
})

router.get('/noAccess', (req, res, next) => {
  res.render('noAccess')
})


//Reset a password via email
router.get('/login/forgotPassword', (req, res, next) => {
  res.render('forgotPassword')
})
router.post('/login/forgotPassword', (req, res, next) => {
  let email = req.body.email;
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, function (err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function (token, done) {
      User.findOne({ email: email, status: "ACTIVE" }, function (err, user) {
        if (!user) {
          res.render('forgotPassword', { message: "No active account with that email adress exists." })
          return;
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function (err) {
          done(err, token, user);
        });
      });
    },
    function (token, user, done) {
      var mailOptions = {
        to: email,
        from: '"Elviras Nähspass Website"',
        subject: 'Password Reset',
        text: 'You are receiving this because you have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions)
        .then(sth => { res.render('forgotPassword', { message: 'An e-mail has been sent to ' + email + ' with further instructions.' }) })
    }
  ], function (err) {
    if (err) return next(err);
    res.redirect('/login/forgotPassword');
  });
})
router.get('/reset/:token', function (req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
    .then(user => {
      if (!user) {
        res.render('forgotPassword', { message: 'Password reset token is invalid or has expired.' })
        return;
      }
      res.render('resetPassword', {
        token: req.params.token
      });
    })
    .catch(err => {
      console.log(err)
    })
});
router.post('/reset/:token', (req, res, next) => {
  async.waterfall([
    function (done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
        .then(user => {
          if (!user) {
            res.render('forgotPassword', { message: 'Password reset token is invalid or has expired.' })
            return;
          }
          if (req.body.newPassw === req.body.confirmPassw) {
            const salt = bcrypt.genSaltSync(bcryptSalt);
            const hashPass = bcrypt.hashSync(req.body.newPassw, salt);
            user.password = hashPass;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            user.save(function (err) {
              req.logIn(user, function (err) {
                done(err, user);
              });
            });
          } else {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } })
              .then(user => {
                res.render('resetPassword', {
                token: req.params.token, message: 'Confirmation passwords must be the same!'
                });
              })
              .catch(err => {
                console.log(err)
              })
          }
        })
        .catch(err => { console.log(err) })
    },
    function (user, done) {
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@demo.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      transporter.sendMail(mailOptions)
        .then(mail => {
          res.render('resetPassword', { message: 'Success! Your password has been changed.' })
        })
    }
  ], function (err) {
    res.redirect('/');
  });
});
//End of reset password



module.exports = router;
