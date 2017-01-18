/*!
 * gulp-boilerplate v4.2.3: My Gulp.js boilerplate for creating new web projects
 * (c) 2017 Chris Ferdinandi
 * MIT License
 * http://github.com/cferdinandi/Plugin
 */

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
        vm.vegetables = loadVegetables();
        vm.selectedVegetables = [];
        vm.numberChips = [];
        vm.numberChips2 = [];
        vm.numberBuffer = '';
        vm.autocompleteDemoRequireMatch = true;
        vm.transformChip = transformChip;
        vm.accessToken = '';
        vm.refreshToken = '';
        vm.userId = '';
        // vm.authenticated = false;
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
     * Search for vegetables.
     */
    function querySearch (query) {
      var results = query ? vm.vegetables.filter(createFilterFor(query)) : [];
      return results;
    }

    /**
     * Create filter function for a query string
     */
    function createFilterFor(query) {
      var lowercaseQuery = angular.lowercase(query);

      return function filterFn(vegetable) {
        return (vegetable._lowername.indexOf(lowercaseQuery) === 0) || 
        (vegetable._lowerartist.indexOf(lowercaseQuery) === 0);
      };

    }

    function loadVegetables() {
      // var promise = getMySavedTracks();
      // promise.then(function (data){
        // console.log("LOADING...");
        var veggies = [];
        for (var i in vm.playlists) {
          console.log(vm.playlists[i].track.name, vm.playlists[i].track.artists[0].name);
          var object = {name: vm.playlists[i].track.name, artist: vm.playlists[i].track.artists[0].name};
          veggies.push(object);
        }
        // console.log(veggies);
        // var veggies = [
        //   {
        //     'name': 'Broccoli',
        //     'type': 'Brassica'
        //   },
        //   {
        //     'name': 'Cabbage',
        //     'type': 'Brassica'
        //   },
        //   {
        //     'name': 'Carrot',
        //     'type': 'Umbelliferous'
        //   },
        //   {
        //     'name': 'Lettuce',
        //     'type': 'Composite'
        //   },
        //   {
        //     'name': 'Spinach',
        //     'type': 'Goosefoot'
        //   }
        // ];

        return veggies.map(function (veg) {
          veg._lowername = veg.name.toLowerCase();
          veg._lowerartist = veg.artist.toLowerCase();
          // veg._lowertype = veg.type.toLowerCase();
          return veg;
        });
      // });
    }

    function getMySavedTracks() {
      var defer = $q.defer();
      console.log("GETTING SAVED TRACKS");
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
      console.log("getUserPlaylists");
      $http.get('/api/getUserPlaylists', {
            params: {user_id: $cookies.get('user_id') }
          })
          .success(function(result) {
            vm.playlists = result.items;
            // console.log(vm.playlists);
            // for (var i in vm.playlists) {
            //   console.log(vm.playlists[i].name);
            // }
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
            // for (var i in vm.playlists) {
            //   console.log(vm.playlists[i].name);
            // }
            defer.resolve(result);
          })
          .error(function(data) {
            defer.reject(data);
            console.log('Error: ' + data);
          });

      return defer.promise;
    }
  }
})();
