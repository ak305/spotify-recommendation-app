(function () {
  'use strict';
  // var request = require('request'); // "Request" library

  angular
      .module('MyApp', ['ngMaterial', 'ngCookies'])
      .controller('SpotifyController', DemoCtrl);

  function DemoCtrl ($http, $timeout, $q, $cookies, $location) {
    var vm = this;
    console.log($location.url());
    
    if (/access_token/.test($location.url()) && /refresh_token/.test($location.url())) {
      vm.authenticated = true;
      var promise = getMySavedTracks();
      promise.then(function(data) {

        vm.readonly = false;
        vm.selectedItem = null;
        vm.searchText = null;
        vm.querySearch = querySearch;
        vm.songs = loadSongs();
        vm.selectedSongs = [];
        vm.numberChips = [];
        vm.numberChips2 = [];
        vm.numberBuffer = '';
        vm.autocompleteDemoRequireMatch = true;
        vm.transformChip = transformChip;
        vm.accessToken = '';
        vm.refreshToken = '';
        vm.userId = '';
      });

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
      return results;
    }

    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(song) {
        return (song._lowername.indexOf(lowercaseQuery) === 0) || 
        (song._lowerartist.indexOf(lowercaseQuery) === 0);
      };

    }

    function loadSongs() {
      var songs = [];
      for (var i in vm.playlists) {
        // console.log(vm.playlists[i].track.name, vm.playlists[i].track.artists[0].name);
        var object = {name: vm.playlists[i].track.name, 
                      artist: vm.playlists[i].track.artists[0].name,
                      id: vm.playlists[i].track.id,
                      artist_id: vm.playlists[i].track.artists[0].id};
        songs.push(object);
      }

      return songs.map(function (song) {
        song._lowername = song.name.toLowerCase();
        song._lowerartist = song.artist.toLowerCase();
        // song._lowertype = song.type.toLowerCase();
        return song;
      });
    }

    function getMySavedTracks() {
      var defer = $q.defer();
      console.log("TEST");
      $http.get('/api/me/tracks')
          .success(function(result) {
            console.log(result);
            vm.playlists = result.items;
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
            vm.playlists = result.items;
            defer.resolve(result);
          })
          .error(function(data) {
            defer.reject(data);
            console.log('Error: ' + data);
          });

      return defer.promise;
    }

    function getPlaylistsTracks() {
      var defer = $q.defer();
      $http.get('/api/getPlaylistsTracks', {
            params: {user_id: $cookies.get('user_id') }
          })
          .success(function(result) {
            vm.playlists = result.items;
            defer.resolve(result);
          })
          .error(function(data) {
            defer.reject(data);
            console.log('Error: ' + data);
          });

      return defer.promise;
    }

    vm.getRecommendations = function() {
      var defer = $q.defer();

      var seedArtists = [];
      var seedTracks = [];
      for (var i in vm.selectedSongs) {
        seedArtists.push(vm.selectedSongs[i].id);
        seedTracks.push(vm.selectedSongs[i].artist_id);
      }

      $http.post('/api/getRecommendations', {
            params: {seed_artists: seedArtists, seed_tracks: seedTracks}
          })
          .success(function(result) {
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
