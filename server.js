'use strict';

// simple express server
var express = require('express');
var app = express();
var router = express.Router();
var request = require('request');
var SpotifyWebApi = require('spotify-web-api-node');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

var generateRandomString = N => (Math.random().toString(36)+Array(N).join('0')).slice(2, N+2);

var client_id = 'c449e814a8ae4ef5ac7abb886c106614'; // Your client id
var client_secret = '474e3c8eb4204961a4558a9e189bd91b'; // Your secret
var redirect_uri = 'http://localhost:3000/callback'; // Your redirect uri
var stateKey = 'spotify_auth_state';
var scopes = ['user-read-private', 'user-read-email'];

// When our access token will expire
var tokenExpirationEpoch;

// Continually print out the time left until the token expires..
var numberOfTimesUpdated = 0;

var spotifyApi = new SpotifyWebApi({
  clientId: client_id,
  clientSecret: client_secret,
  redirectUri: redirect_uri
});

var updateRefreshToken = function() {
  // console.log('Time left: ' + Math.floor((tokenExpirationEpoch - new Date().getTime() / 1000)) + ' seconds left!');

  // OK, we need to refresh the token. Stop printing and refresh.
  // if (++numberOfTimesUpdated > 5) {
    // clearInterval(this);

    // Refresh token and print the new time to expiration.
    spotifyApi.refreshAccessToken()
      .then(function(data) {
        tokenExpirationEpoch = (new Date().getTime() / 1000) + data.body['expires_in'];
        console.log('Refreshed token. It now expires in ' + Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) + ' seconds!');
      }, function(err) {
        console.log('Could not refresh the token!', err.message);
      });
  // }
};


app.use(express.static(__dirname))
	 .use(cookieParser());   
// console.log(__dirname + "/docs");

// app.use(express.static('docs'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/docs/index.html');
});

app.get('/login', (_, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);
  console.log(state);
  res.redirect(spotifyApi.createAuthorizeURL(scopes, state));
});

app.get('/callback', (req, res) => {
	// your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;
  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    spotifyApi.authorizationCodeGrant(code).then(data => {
      const { expires_in, access_token, refresh_token } = data.body;

      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      // use the access token to access the Spotify Web API
      spotifyApi.getMe().then(({ body }) => {
        console.log(body);
      });

      // we can also pass the token to the browser to make requests from there
      res.redirect('/#' +
        querystring.stringify({
          access_token: access_token,
          refresh_token: refresh_token
        }));

      

    }).catch(err => {
      res.redirect('/#' +
        querystring.stringify({
          error: 'invalid_token'
        }));
    });
  }
});

// app.get('/api/getAccessToken', (req, res) => {
// 	res.send({accessToken: spotifyApi.getAccessToken()});
// });



app.listen(3000, () => {
    console.log('listening on 3000');   
});


app.get('*', (req, res) =>{
  res.sendFile('docs/index.html'); // load the single view file (angular will handle the page changes on the front-end)
})

