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
  Post.find({ status: "ACTIVE" }, null, { sort: { created_at: -1 } })
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
  Equipment.find(null, null, { sort: { created_at: -1 }})
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
  var allPictures = ["../images/IMG_5978.JPG","../images/IMG_5985.JPG","../images/IMG_6027.JPG","../images/IMG_5989.JPG","../images/IMG_6122.JPG","../images/IMG_6127.JPG","../images/IMG_6010.JPG","../images/IMG_6132.JPG","../images/IMG_6144.JPG","../images/IMG_6022.JPG","../images/IMG_6148.JPG", "../images/IMG_6057.JPG","../images/IMG_6062.JPG","../images/IMG_6151.JPG","../images/pic2.jpg", "../images/pic22.JPG", "../images/pic23.JPG", "../images/pic24.JPG", "../images/pic25.JPG", "../images/pic26.JPG", "../images/pic27.JPG", "../images/pic3.jpg", "../images/pic4.jpg", "../images/pic5.jpg", "../images/pic6.jpg", "../images/pic7.jpg", "../images/pic8.jpg", "../images/pic9.jpg", "../images/pic10.jpg", "../images/pic11.jpg", "../images/pic12.jpg", "../images/pic13.jpg"]
  res.render('galerie', {pictures:allPictures})
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
    to: 'elvirasnaehspass@gmail.com',
    from: '"Elviras Nähspass Website"',
    subject: 'Betreff: ' + req.body.subject,
    text: 'Jemand auf der neuen Website hat ein Kontaktformular geschickt!\n\n' +
      'Das Kontaktformular wurde von ' + req.body.name + ' gesendet.\n\n' +
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
          res.render('forgotPassword', { message: "Mit dieser Email Adress gibt es keinen aktiven Account" })
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
        text: 'Du bekommst diese Email, weil du angefragt hast, dein Passwort zurück zu setzen\n\n' +
          'Klicke auf den folgenden Link oder kopiere den Link in deinen Browser.\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'Der Link ist eine Stunde lang gültig\n\n' +
          'Solltest du das nicht angefragt haben, ignoriere diese Email und das Passwort bleibt unverändert.\n'
      };
      transporter.sendMail(mailOptions)
        .then(sth => { res.render('forgotPassword', { message: 'Es wurde eine Email an ' + email + ' mit weiterer Anleitung gesendet!' }) })
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
        res.render('forgotPassword', { message: 'Der Link ist ungültig oder abgelaufen!' })
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
            res.render('forgotPassword', { message: 'Der Link ist ungültig oder abgelaufen!' })
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
                token: req.params.token, message: 'Die neuen Passwörter müssen übereinstimmen!'
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
        text: 'Hallo,\n\n' +
          'Dies ist eine Bestätigung dass das Passwort für ' + user.email + ' gerade verändert wurde.\n'
      };
      transporter.sendMail(mailOptions)
        .then(mail => {
          res.render('resetPassword', { message: 'Erfolgreich! Das Passwort wurde geändert.' })
        })
    }
  ], function (err) {
    res.redirect('/');
  });
});
//End of reset password



module.exports = router;
