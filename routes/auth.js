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

let transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD
  }
});

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

function randPlaceholder() {
  var possNames = ["Donald Duck", "Daisy Duck", "Mickey Mouse", "Minnie Mouse", "Goofy", "Pluto"]
  var possEmails = ["donald.duck@entenhausen.com", "daisy.duck@entenhausen.com", "mickey.mouse@entenhausen.com", "minnie.mouse@entenhausen.com", "goofy@entenhausen.com", "pluto@entenhausen.com"]
  var possPhone = ["96727/*donald*", "96727/*daisy*", "96727/*mickey*", "96727/*minnie*", "96727/*goofy*", "96727/*pluto*"]
  var possAdress = ["Ulmengasse 321, Entenhausen", "Zypressenweg 5, Entenhausen", "Zwiebelweg 12, Entenhausen", "Geranienweg 15, Entenhausen", "Lindenstraße 8, Entenhausen", "Zwiebelweg 12, Entenhausen"]
  var index = Math.floor(Math.random() * possNames.length)
  return [possNames[index], possEmails[index], possPhone[index], possAdress[index]]
}

router.get("/login", (req, res, next) => {
  var input = randPlaceholder()
  res.render("auth/login", { input: input, "message": req.flash("error") });
});

router.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}));

router.get("/signup", ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  var input = randPlaceholder()
  res.render("auth/signup", { input: input });
});

router.post("/signup", ensureAuthenticated, checkRole("ADMIN"), (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const adress = req.body.adress;
  const phone = req.body.phone;

  if (name === "" || email === "") {
    res.render("auth/signup", { message: "Bitte fülle Name und Email aus!" });
    return;
  }

  User.findOne({ email }, "email", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", { message: "Diese Email gibt es bereits!" });
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
      text: 'Ein Administrator hat gerade einen Account für dich erstellt!.\n\n' +
        'Ab jetzt, kannst du dich auf unserer Internetseite einloggen und deine Kurs Informationen einsehen.\n\n' +
        'Hier findest du alle Daten und Infos, die du brauchst. Du kannst nichts davon bearbeiten!\n\n' +
        'Auf der Website kannst du ebenfalls Sachen posten! Die Sachen erscheinen dann, nachdem ein Administartor sie genehmigt hat, auf der Start Seite!\n\n' +
        'Hier ist deine Login information:\n\n' +
        'Deine Email: ' + email + '\n\n' +
        'Dein vorläufiges Passwort: ' + randPassword + '\n\n' +
        'Auf deiner Profilseite kannst du dein Passwort ändern, bitte mache das so bald wie möglich!\n'
    };
    transporter.sendMail(mailOptions)

    newUser.save()
      .then(() => {
        res.redirect("/");
      })
      .catch(err => {
        res.render("auth/signup", { message: "Etwas hat nicht geklappt" });
      })
  });
});

router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

module.exports = router;
