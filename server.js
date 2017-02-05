var express = require('express');
var app = express();
var port = 8080;

var router = require('./app/routes');
app.use('/', router);

//set static files (css, imgs)
app.use(express.static(__dirname + '/public'));

//start server
app.listen(process.env.PORT || port, function () {
    console.log('app started');
})