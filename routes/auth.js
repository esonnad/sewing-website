const express = require("express");
const passport = require('passport');
const router = express.Router();
const Post = require('../models/Post')
const Course = require('../models/Course')
const User = require('../models/User')
const Equipment = require('../models/Equipment')
const multer = require('multer');
const uploadCloud = require('../config/cloudinary.js');
const nodemailer = require('nodemailer')
const Request = require('../models/Request')

// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;

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

router.get("/login", (req, res, next) => {
  res.render("auth/login", { "message": req.flash("error") });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}));

router.get("/signup", ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  res.render("auth/signup");
});

router.post("/signup", ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const adress = req.body.adress;
  const phone = req.body.phone;

  if (name === "" || email === "") {
    res.render("auth/signup", { message: "Indicate username and email" });
    return;
  }

  User.findOne({ email }, "email", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", { message: "This email is already in use" });
      return;
    }
    var pwdChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var pwdLen = 10;
    var randPassword = Array(pwdLen).fill(pwdChars).map(function (x) { return x[Math.floor(Math.random() * x.length)] }).join('');
    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(randPassword, salt);

    const newUser = new User({
      name: name,
      email: email,
      role: "STUDENT",
      status: "ACTIVE",
      password: hashPass,
      adress: adress,
      phone: phone,
    });

    var mailOptions = {
      to: email,
      from: '"Elviras Nähspass Website"',
      subject: 'Your login information!',
      text: 'One of the Admins has made an account for you.\n\n' +
        'From now on, you can login in on our website, and view your course information.\n\n' +
        'Here you can find all dates and information you need to know. You are not able to edit anything on the course.\n\n' +
        'On the website, you can also post things! If you have sewed something, or you just have some experience to share, we would be really grateful, if you post something!\n\n' +
        'As soon, as you post is confirmed by one Admin, it will appear on the home page!\n\n' +
        'This is your login information:\n\n' +
        'Your email:' + email + '\n\n' +
        'Your temporary password:' + randPassword + '\n\n' +
        'You can change your password on your profile page. Please do that as soon as possible!\n'
    };
    transporter.sendMail(mailOptions)

    newUser.save()
      .then(() => {
        res.redirect("/");
      })
      .catch(err => {
        res.render("auth/signup", { message: "Something went wrong" });
      })
  });
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;
