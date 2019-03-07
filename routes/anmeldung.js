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

router.post('/kurse', async (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const phone = req.body.phone;
  const adress = req.body.adress;
  const message = req.body.message;
  const shareName = req.body.shareName;
  const shareEmail = req.body.shareEmail
  const checkbox = req.body.sharingBox
  const preferences = [];

  console.log("REQUEST FORM", req.body)

  if (req.body.choice1 != '') {
    preferences.push(req.body.choice1);
  }
  if (req.body.choice2 != '') {
    preferences.push(req.body.choice2);
  }
  if (req.body.choice3 != '') {
    preferences.push(req.body.choice3);
  }

  console.log("PREFERENCES:", preferences)

  if (name === "" || phone === "" || email === "") {
    res.render("anmeldung-kurse", { message: "Bitte fülle Name, Telefon und Email aus!" });
    return;
  }
  if(checkbox==="sharing"){
    if (shareName === "" || shareEmail === "") {
      res.render("anmeldung-kurse", { message: "Bitte fülle Name und Email der Person aus, mit der du den Kurs teilst!" });
      return;
    }
  }
  var courseOne = await Course.find({_id:preferences[0]})
  var html = `<h1>Die Anfrage:</h1><hr>`
  if(checkbox==="sharing"){
    html += `<p>${name} und ${shareName} möchten gemeinsam diesem Kurs betreten:<br>Erste Wahl: ${courseOne[0].name} (ID:${preferences[0]})`
  } else {
    html += `<p>${name} möchte diesem Kurs betreten:<br>Erste Wahl: ${courseOne[0].name} (ID:${preferences[0]})`
  }

  if(preferences[1]!==undefined){
    var courseTwo = await Course.find({_id:preferences[1]})
    html += `<br>Zweite Wahl: ${courseTwo[0].name} (ID:${preferences[1]})`
  }
  if(preferences[2]!==undefined){
    var courseThree = await Course.find({_id:preferences[2]})
    html += `<br>Dritte Wahl: ${courseThree[0].name} (ID:${preferences[2]})`
  }

  html += `</p><p>Weitere Mitteilung: ${message}</p><br><hr><br>`
  transporter.sendMail({
    from: '"Elviras Naehspass Website"',
    to: "elvirasnaehspass@gmail.com",
    subject: "Eine neue Kurs Anmeldung",
    text: message,
    html: html
  })
    .then(sth => {
      if(checkbox==="sharing"){//kursplatz teilen
        Promise.all([User.find({email:email}), User.find({email:shareEmail})])
          .then((bothUsers)=>{
            var userOne = bothUsers[0]
            var userTwo = bothUsers[1]
            console.log("one",userOne,"two",userTwo)
            if(userOne[0]){
              console.log("user1 is known")
              if(userTwo[0]){//beide sind bereits registriert
                const newRequest = new Request({
                  _user: userOne[0]._id,
                  _share: userTwo[0]._id,
                  preferences: preferences,
                })
                newRequest.save()
                  .then(sth => { res.render('registration-success') })
                  .catch(err => { res.render('registration-failed'), console.log(err) })
              } else {//Person 2 ist neu
                const newUser = new User({
                  name: shareName,
                  email: shareEmail,
                  role: "STUDENT",
                  status: "PENDING",
                  address: "",
                  phone: "",
                })
                newUser.save()
                  .then(user2 => {
                    const newRequest = new Request({
                      _user: userOne[0]._id,
                      _share: user2._id,
                      _preferences: preferences,
                    })
                    newRequest.save()
                      .then(sth => { res.render('registration-success') })
                      .catch(err => { res.render('registration-failed'), console.log(err) })
                  })
                  .catch(err => { res.render('registration-failed'), console.log(err) })
              }
            }else {
              console.log("user1 is not known")
              if(userTwo[0]){//person 1 ist neu
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
                      _share: userTwo[0]._id,
                      _preferences: preferences,
                    })
                    newRequest.save()
                      .then(sth => { res.render('registration-success') })
                      .catch(err => { res.render('registration-failed'), console.log(err) })
                  })
                  .catch(err => { res.render('registration-failed'), console.log(err) })
              } else {//beide sind neu
                const newUserOne = new User({
                  name: name,
                  email: email,
                  role: "STUDENT",
                  status: "PENDING",
                  address: adress,
                  phone: phone,
                })
                const newUserTwo = new User({
                  name: shareName,
                  email: shareEmail,
                  role: "STUDENT",
                  status: "PENDING",
                  address: "",
                  phone: "",
                })
                newUserOne.save()
                  .then(user1=>{
                    newUserTwo.save()
                      .then(user2 => {
                        const newRequest = new Request({
                          _user: user1._id,
                          _share: user2._id,
                          _preferences: preferences,
                        })
                        newRequest.save()
                          .then(sth => { res.render('registration-success') })
                          .catch(err => { res.render('registration-failed'), console.log(err) })
                      })
                      .catch(err => { res.render('registration-failed'), console.log(err) })
                  })
                  .catch(err => { res.render('registration-failed'), console.log(err) })
              }
            }
          })
          .catch(err => { res.render('registration-failed'), console.log(err) })

      }else { //kursplatz nicht teilen
      User.find({ email: email })
        .then(user => {
          if (user[0]) {
            console.log("PREFERENCES2", preferences)
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
      }

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

router.post('/workshops', async (req, res, next) => {
  const name = req.body.name;
  const email = req.body.email;
  const phone = req.body.phone;
  const adress = req.body.adress;
  const message = req.body.message;
  const workshop = req.body.workshop;

  if (name === "" || phone === "" || email === "") {
    res.render("anmeldung-workshops", { message: "Bitte fülle Name, Telefon und Email aus!" });
    return;
  }
  var workshopName = await Course.find({_id:workshop})
  var toMail = "elvirasnaehspass@gmail.com"
  if(workshopName[0].name.includes("Dessous")||workshopName[0].name.includes("dessous")){
    toMail += ", beckmannbarbara@web.de"
  }
  transporter.sendMail({
    from: '"Elviras Naehspass Website"',
    to: toMail,
    subject: "Ein neue Workshop Anmeldung",
    text: message,
    html: `<h1>Die Anfrage:</h1><hr><p>${name} möchte an ${workshopName[0].name} (ID: ${workshop}) teilnehmen</p><p>Die eingetragenen Infos sind:<br>Name: ${name}, Email: ${email}, Telefon: ${phone}, Adresse: ${adress}</p><p>${name}'s weitere Mitteilung: ${message}</p><br><hr><br>`
  })
    .then(sth => {
      res.render('registration-success')
    })
    .catch(error => console.log(error));
})

module.exports = router;