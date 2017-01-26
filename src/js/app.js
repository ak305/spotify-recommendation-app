(function () {
  'use strict';
  // var request = require('request'); // "Request" library

  angular
      .module('MyApp', ['ngMaterial', 'ngCookies'])
      .controller('SpotifyController', DemoCtrl)
      .filter('trusted', ['$sce', function ($sce) {
          return function(url) {
              return $sce.trustAsResourceUrl(url);
          };
      }]);

  function DemoCtrl ($http, $timeout, $q, $cookies, $location) {
    var vm = this;
    console.log($location.url());
    if (/access_token/.test($location.url()) && /refresh_token/.test($location.url())) {
      vm.authenticated = true;
      vm.playlists = [];
      var promise = getUserPlaylists();
      promise.then(function(data) {

        vm.readonly = false;
        vm.selectedItem = null;
        vm.searchText = null;
        vm.querySearch = querySearch;
        // vm.songs = loadSongs();
        vm.selectedSongs = [];
        vm.numberChips = [];
        vm.numberChips2 = [];
        vm.numberBuffer = '';
        vm.autocompleteDemoRequireMatch = true;
        vm.transformChip = transformChip;
        vm.accessToken = '';
        vm.refreshToken = '';
        vm.userId = '';
        vm.recommendations = [];
        vm.songs = [];
        vm.loggedIn = true;
        vm.playlistSelected = false;
      });

    } else {
      vm.loggedIn = false;
    }

    /**
     * Return the proper object when the append is called.
     */
    function transformChip(chip) {
      // If it is an object, it's already a known chip
      if (angular.isObject(chip)) {
        return chip;
      }

      // Otherwise, create a new one
      return { name: chip};
    }

    /**
     * Search for songs.
     */
    function querySearch (query) {
      var results = query ? vm.songs.filter(createFilterFor(query)) : [];
      console.log(results);
      return results;
    }

    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(song) {
        console.log("SONG IS ",song);
        return (song._lowername.indexOf(lowercaseQuery) === 0) || 
        (song._lowerartist.indexOf(lowercaseQuery) === 0);
      };

    }

    function loadSongs() {
      console.log("TEST");
      vm.readonly = false;
      vm.selectedItem = null;
      vm.searchText = null;
      vm.querySearch = querySearch;
      // vm.songs = loadSongs();
      vm.selectedSongs = [];
      vm.numberChips = [];
      vm.numberChips2 = [];
      vm.numberBuffer = '';
      vm.autocompleteDemoRequireMatch = true;
      vm.transformChip = transformChip;
      console.log("LENGTH IS " + vm.songs.length);
      var songs = vm.songs;
      // for (var i in vm.playlists) {
      //   // console.log(vm.playlists[i].track.name, vm.playlists[i].track.artists[0].name);
      //   var object = {name: vm.playlists[i].track.name, 
      //                 artist: vm.playlists[i].track.artists[0].name,
      //                 id: vm.playlists[i].track.id,
      //                 artist_id: vm.playlists[i].track.artists[0].id};
      //   songs.push(object);
      // }
      console.log(songs, vm.playlistSelected);
      return songs.map(function (song) {
        song._lowername = song.name.toLowerCase();
        song._lowerartist = song.artist.toLowerCase();
        // song._lowertype = song.type.toLowerCase();
        return song;
      });
    }

    function getMySavedTracks() {
      var defer = $q.defer();
      // console.log("TEST");
      $http.get('/api/me/tracks')
          .success(function(result) {
            console.log(result);
            vm.songs = [];
            for (var i in result.items) {
              var object = {name: result.items[i].track.name, 
                            artist: result.items[i].track.artists[0].name,
                            id: result.items[i].track.id,
                            artist_id: result.items[i].track.artists[0].id};
              songs.push(object);
            }
            defer.resolve(result);
          })
          .error(function(data) {
            defer.reject(data);
            console.log('Error: ' + data);
          });

      return defer.promise;
    }

    function getUserPlaylists() {
      var defer = $q.defer();
      $http.get('/api/getUserPlaylists', {
            params: {user_id: $cookies.get('user_id') }
          })
          .success(function(result) {
            console.log(result);
            // vm.playlists = result.items;
            for (var i in result.items) {
              var object = {name: result.items[i].name, 
                            id: result.items[i].id };
              console.log(result.items[i].name);
              vm.playlists.push(object);
            }
            defer.resolve(result);
          })
          .error(function(data) {
            defer.reject(data);
            console.log('Error: ' + data);
          });

      return defer.promise;
    }

    vm.getPlaylistsTracks = function(playlist) {
      var defer = $q.defer();
      // console.log("HI");
      $http.get('/api/getPlaylistsTracks', {
            params: { user_id: $cookies.get('user_id'), playlist_id: playlist.id }
          })
          .success(function(result) {
            console.log(result);
            vm.songs = [];
            for (var i in result.tracks.items) {
              var object = {name: result.tracks.items[i].track.name, 
                            artist: result.tracks.items[i].track.artists[0].name,
                            id: result.tracks.items[i].track.id,
                            artist_id: result.tracks.items[i].track.artists[0].id};
              vm.songs.push(object);
            }
            loadSongs();
            vm.playlistSelected = true;

            defer.resolve(result);
          })
          .error(function(data) {
            defer.reject(data);
            console.log('Error: ' + data);
          });

      return defer.promise;
    };

    vm.getRecommendations = function() {
      var defer = $q.defer();

      var seedArtists = [];
      var seedTracks = [];
      for (var i in vm.selectedSongs) {
        seedArtists.push(vm.selectedSongs[i].artist_id);
        seedTracks.push(vm.selectedSongs[i].id);
      }

      $http.post('/api/getRecommendations', {
            params: {seed_artists: seedArtists, seed_tracks: seedTracks}
          })
          .success(function(result) {
            console.log(result);
            for (var i in result.tracks) {
              var object = {song: result.tracks[i].name, 
                            artist: result.tracks[i].artists[0].name,
                            uri: "https://embed.spotify.com/?uri=" + result.tracks[i].uri };
              vm.recommendations.push(object);
            }
            loadSongs();
            vm.playlistSelected = true;

            defer.resolve(result);
          })
          .error(function(data) {
            defer.reject(data);
            console.log('Error: ' + data);
          });

      return defer.promise;
    };   
  }
})();
