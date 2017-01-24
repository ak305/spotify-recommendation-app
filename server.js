'use strict';

// simple express server
var express = require('express');
var app = express();
var router = express.Router();
var request = require('request');
var SpotifyWebApi = require('spotify-web-api-node');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');


var generateRandomString = N => (Math.random().toString(36)+Array(N).join('0')).slice(2, N+2);

var client_id = 'c449e814a8ae4ef5ac7abb886c106614'; // Your client id
var client_secret = '474e3c8eb4204961a4558a9e189bd91b'; // Your secret
var redirect_uri = 'http://localhost:3000/callback'; // Your redirect uri
var stateKey = 'spotify_auth_state';
var scopes = ['user-read-private', 'user-read-email', 'user-library-read'];

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


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(__dirname));
app.use(morgan('dev'));                                         // log every request to the console

// console.log(__dirname + "/docs");

// app.use(express.static('docs'));
app.get('/', function(req, res) {
	// res.clearCookie('access_token');
	// res.clearCookie('refresh_token');
	// res.clearCookie('user_id');	
  res.sendFile(__dirname + '/docs/index.html');
});

app.get('/login', (_, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);
  // console.log(state);
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
   
    spotifyApi.authorizationCodeGrant(code).then(data => {
      const { expires_in, access_token, refresh_token } = data.body;

      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);
      res.cookie('access_token', access_token);
      res.cookie('refresh_token', refresh_token);

      // use the access token to access the Spotify Web API
      spotifyApi.getMe().then(({ body }) => {
        // console.log(body.id);
        res.cookie('user_id', body.id);
        // we can also pass the token to the browser to make requests from there
	      res.redirect('/#' +
	        querystring.stringify({
	          access_token: access_token,
	          refresh_token: refresh_token
	        }));
      });

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

app.get('/api/me', (req, res) => {
	spotifyApi.getMe()
  .then(function(data) {
    console.log('Some information about the authenticated user', data.body);
  }, function(err) {
    console.log('Something went wrong!', err);
  });
});

app.get('/api/me/tracks', (req, res) => {
	console.log(spotifyApi.getAccessToken());
	spotifyApi.getMySavedTracks()
  .then(function(data) {
    // console.log('Done!', data);
    res.send(data.body);
  }, function(err) {
    console.log('Something went wrong!', err);
  });
});

app.get('/api/getUserPlaylists', (req, res) => {
	// console.log(req.query.user_id);
	spotifyApi.getUserPlaylists()
  .then(function(data) {
    // console.log('Retrieved playlists', data.body);
    res.send(data.body);
  },function(err) {
    console.log('Something went wrong!', err);
  });
});

app.get('/api/getPlaylistsTracks', (req, res) => {
	console.log(req.query.playlist_id);
	spotifyApi.getPlaylist(req.query.user_id, req.query.playlist_id)
  .then(function(data) {
    console.log('Some information about this playlist', data.body);
    res.send(data.body);
  }, function(err) {
    console.log('Something went wrong!', err);
  });
});


app.post('/api/getRecommendations', (req, res) => {
	console.log(req.body);
	console.log(req.body.params.seed_tracks);
	spotifyApi.getRecommendations({seed_artists: req.body.params.seed_artists, seed_tracks: req.body.params.seed_tracks})
	.then(function(data) {
		console.log(data.body);
		res.send(data.body);

	}, function(err) {
    console.log('Something went wrong!', err);
	});
});

app.listen(3000, () => {
    console.log('listening on 3000');   
});


app.get('*', (req, res) =>{
  // res.sendFile('docs/index.html'); // load the single view file (angular will handle the page changes on the front-end)
  res.sendFile(__dirname + '/docs/index.html');

});

