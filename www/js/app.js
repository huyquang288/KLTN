// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.services', 'ngSanitize','btford.socket-io'])

    .run(function ($ionicPlatform, $rootScope, $location) {
        $ionicPlatform.ready(function () {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
                cordova.plugins.Keyboard.disableScroll(true);
            }
            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleLightContent();
            }
        });
        //console.log('hih');
        //$location.path('/tab/activities/')
        //$rootScope.currentUserID = 213;
    })

    .factory('Auth', function ($rootScope) {
        if (localStorage['ionic_session']) {
            var _user = JSON.parse(localStorage['ionic_session']);
        }
        var setUser = function (session) {
            _user = session;
            //_user= 1;
            localStorage['ionic_session'] = JSON.stringify(_user);
        }

        return {
            setUser: setUser,
            isLoggedIn: function () {
                if (_user) {
                    $rootScope.userId= _user;
                    return true;
                }
                return false;
            },
            getUser: function () {
                return _user;
            },
            logout: function () {
                window.localStorage.removeItem("ionic_session");
                window.localStorage.removeItem("ionic_data");
                _user = null;
            }
        }
    })

    .config(function ($stateProvider, $urlRouterProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider

            // setup an abstract state for the tabs directive
            .state('tab', {
                url: '/tab',
                abstract: true,
                templateUrl: 'templates/tabs.html',
                onEnter: function($state, Auth) {
                    //console.log('run');
                    if (!Auth.isLoggedIn()) {
                        $state.go('login');
                    }
                }
            })
            // Each tab has its own nav history stack:
            .state('tab.activities', {
                url: '/activities',
                views: {
                    'tab-activities': {
                        templateUrl: 'templates/tab-activities.html',
                        controller: 'ActivitiesCtrl'
                    }
                }
            })
            .state('topics', {
                url: '/topics/:groupId/:belong',
                templateUrl: 'templates/topics.html',
                controller: 'TopicsCtrl'
            })
            .state('members-in-group', {
                url: '/group-members/:groupId',
                templateUrl: 'templates/members-in-group.html',
                controller: 'GroupsCtrl'
            })
            .state('topic', {
                url: '/topic/:topicId',
                templateUrl: 'templates/topic.html',
                controller: 'TopicCtrl'
            })
            .state('topic-user', {
                url: '/topic/:topicId/:userId',
                templateUrl: 'templates/topic.html',
                controller: 'topicCtrl'
            })
            .state('topic-group', {
                url: '/topic/:topicId/:groupName/:userList',
                templateUrl: 'templates/topic.html',
                controller: 'TopicCtrl'
            })

            .state('topic-setting', {
                url: '/topic-setting/:topicId',
                templateUrl: 'templates/topic-setting.html',
                controller: 'TopicSettingCtrl'
            })

            .state('topic-setting-user', {
                url: '/topic-setting/:topicId/:userId',
                templateUrl: 'templates/topic-setting.html',
                controller: 'TopicSettingCtrl'
            })
            .state('topic-setting-group', {
                url: '/topic-setting/:topicId/:groupName/:userList',
                templateUrl: 'templates/topic-setting.html',
                controller: 'TopicSettingCtrl'
            })
            .state('user-setting', {
                url: '/user-setting/:userId',
                templateUrl: 'templates/user-setting.html',
                controller: 'UserSettingCtrl'
            })

            .state('tab.groups', {
                url: '/groups',
                views: {
                    'tab-groups': {
                        templateUrl: 'templates/tab-groups.html',
                        controller: 'GroupsCtrl'
                    }
                }
            })

            .state('group-setting', {
                url: '/group-setting/:groupId',
                templateUrl: 'templates/group-setting.html',
                controller: 'GroupSettingCtrl'
            })

            .state('tab.people', {
                url: '/people',
                views: {
                    'tab-people': {
                        templateUrl: 'templates/tab-people.html',
                        controller: 'FriendsCtrl'
                    }
                }
            })

            .state('tab.friends', {
                url: '/friends',
                abstract: true,
                views: {
                    'tab-friends': {
                        templateUrl: 'templates/tab-friends.html',
                        controller: 'FriendsCtrl'
                    }
                }
            })

            .state('tab.friends.active', {
                url: '/active',
                templateUrl: 'templates/tab-friends-active.html'

            })

            .state('tab.account', {
                url: '/account',
                views: {
                    'tab-account': {
                        templateUrl: 'templates/tab-account.html',
                        controller: 'AccountCtrl'
                    }
                }
            })

            // All templates about user
            .state('login', {
                url: '/login',
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl'
            })
            .state('sign-up', {
                url: '/sign-up',
                templateUrl: 'templates/sign-up.html'
            })
            .state('sign-up-name', {
                url: '/sign-up-name',
                templateUrl: 'templates/sign-up-name.html'
            })
            .state('sign-up-photo', {
                url: '/sign-up-photo',
                templateUrl: 'templates/sign-up-photo.html'
            })
            .state('sign-up-success', {
                url: '/sign-up-success',
                templateUrl: 'templates/sign-up-success.html'
            })
            .state('forgot-password', {
                url: '/forgot-password',
                templateUrl: 'templates/forgot-password.html'
            });

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise('/tab/activities');

    });

