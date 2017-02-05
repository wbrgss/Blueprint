//require express
var express = require('express');
var path = require('path');

//create router
var router = express.Router();

//export router
module.exports = router;

// route homepage
router.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, '../index.html'));
})

router.get('/about', function(req, res) {
    res.send('(C) Will Burgess 2017');
})