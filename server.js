'use strict';

// simple express server
var express = require('express');
var app = express();
var router = express.Router();
var request = require('request');
var SpotifyWebApi = require('spotify-web-api-node');

app.use(express.static(__dirname + "/docs"));   
console.log(__dirname + "/docs");

app.use(express.static('public'));
app.get('/', function(req, res) {
    res.sendfile('index.html');
});

app.listen(3000, () => {
    console.log('listening on 3000');   
});



app.get('/api/getToken' , (req, res) => {
	res.send("HI");
});

app.get('*', (req, res) =>{
  res.sendFile('index.html'); // load the single view file (angular will handle the page changes on the front-end)
})

