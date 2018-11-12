const express = require('express');
const router = express.Router();

router.get('/postAdmin', (req, res, next) => {
  res.render('admin/postAdmin')
})

module.exports = router;