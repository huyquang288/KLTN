angular.module('starter.controllers', ['ngSanitize', 'ionic', 'ngSanitize', 'btford.socket-io', 'angular-md5'])

    // MainCtrl được gọi đầu tiên khi ng dùng TRUY CẬP VÀO TRANG LOGIN
    .controller('MainCtrl', function ($scope, $stateParams, Room, User, $ionicModal, $location, $rootScope, $ionicPopup) {
        //console.log("MainCtrl");
        $scope.historyBack = function () {
            window.history.back();
        };

        $scope.fullData= $rootScope.fullData;
        $scope.recent= $rootScope.recent;

        $scope.friends = User.myFriends("213");
        $scope.activities = Room.userActivities("213");

        // for tab-account and sign-up-success
        $scope.user = User.get("213");

        // for new-group
        $rootScope.newGroupName = '';
        $scope.createNewGroup = function (groupName) {
            var roomUserList = "";
            for (var i = 0; i < $scope.friends.length; i++)
                if ($scope.friends[i].checked) {
                    if (!roomUserList) {
                        roomUserList = $scope.friends[i].id;
                    }
                    else {
                        roomUserList += "+" + $scope.friends[i].id;
                    }
                }

            if (roomUserList.split("+").length < 2 || !groupName) {
                if (roomUserList.split("+").length < 2) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Please Add More People',
                        template: 'Groups need at least three people.',
                        okType: 'button-clear'
                    });
                    return;
                }
                if (!groupName) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Name This Group',
                        template: 'To create the group, please name it first. (Anyone in the group can change the name later.)',
                        okType: 'button-clear'
                    });
                    return;
                }
            }
            else {
                roomUserList += "+213";
                $location.path("/room/new/" + groupName + "/" + roomUserList);
                $rootScope.newGroupName = '';
                for (var i = 0; i < $scope.friends.length; i++) {
                    $scope.friends[i].checked = '';
                }
            }

        }

        // new-chat modal
        $ionicModal.fromTemplateUrl('templates/modal/new-chat.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.newChatmodal = modal;
        });
        $scope.openNewChat = function () {
            $scope.newChatmodal.show();
        };
        $scope.closeNewChat = function () {
            $scope.newChatmodal.hide();
        };

        // new-group modal
        $ionicModal.fromTemplateUrl('templates/modal/new-group.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.newGroupModal = modal;
        });
        $scope.openNewGroup = function () {
            $scope.newGroupModal.show();

        };
        $scope.closeNewGroup = function () {
            $scope.newGroupModal.hide();
        };

        // add-people modal
        $ionicModal.fromTemplateUrl('templates/modal/add-people.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.addPeopleModal = modal;
        });
        $scope.openAddPeople = function () {
            $scope.addPeopleModal.show();

        };
        $scope.closeAddPeople = function () {
            $scope.addPeopleModal.hide();
        };

        // search modal
        for (var i in $scope.friends) {
            var room = Room.getByUserId($scope.friends[i].id);

            $scope.friends[i].room = room;
        }

        $ionicModal.fromTemplateUrl('templates/modal/search.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.searchModal = modal;
        });
        $scope.openSearch = function () {
            $scope.searchModal.show();

        };
        $scope.closeSearch = function () {
            $scope.searchModal.hide();
        };

        $scope.clearSearch = function () {
            $scope.search = "";
        };

        $ionicModal.fromTemplateUrl('templates/modal/group-search.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.groupSearchModal = modal;
        });
        $scope.openGroupSearch = function () {
            $scope.groupSearchModal.show();

        };
        $scope.closeGroupSearch = function () {
            $scope.groupSearchModal.hide();
        };

        $scope.clearGroupSearch = function () {
            $scope.search = "";
        };

        $scope.$on('$stateChangeStart', function () {
            if ($scope.searchModal) {
                $scope.closeSearch();
                $scope.clearSearch();
            }
            if ($scope.addPeopleModal) {
                $scope.closeAddPeople();
            }
            if ($scope.newGroupModal) {
                $scope.closeNewGroup();
            }
            if ($scope.newChatmodal) {
                $scope.closeNewChat();
            }
        });
    })

    // ActivitiesCtrl được gọi tiếp theo, sau MainCtrl. ActivitiesCtrl được gọi khi người dùng đăng nhập thành công, truy cập vào trang Recent
    .controller('ActivitiesCtrl', function ($rootScope, $scope, Room, User, Data) {
        console.log("ActivitiesCtrl");

        // lấy dữ liệu từ server về sau khi đăng nhập thành công...
        var userId= $rootScope.userId;
        if (userId!="" && userId!=undefined) {

            Data.getRecent(userId).then(function(data){
                $rootScope.recent= data;
                //console.log($rootScope.recent);
                $scope.recent= $rootScope.recent;
            });

            Data.getPeopleInGroup(userId).then(function(data) {
                $rootScope.peopleInGroup= data;
                //console.log('get people done')
                //console.log($rootScope.peopleInGroup);
            });

            Data.getAll(userId).then(function(data) {
                $rootScope.fullData= data;
                //$scope.fullData= $rootScope.fullData; 
                sortRooms();
            });
        }

        $rootScope.$on("CallSortRoomsInActivitiesCtrl", function(){
            console.log("emit done");
            sortRooms();
        });
        
        function sortRooms () {
            $rootScope.recentRooms=[];
            $scope.recentRoomsTemp=[];
            // lấy hết các room trong json thành 1 file temp để chuẩn bị sắp xếp theo chiều thời gian
            for (var i=0; i<$rootScope.fullData.length; i++) {
                for (var j=0; j<$rootScope.fullData[i].group_room.length;j++) {
                    $scope.recentRoomsTemp.push($rootScope.fullData[i].group_room[j].rooms);
                }
            }
            // sắp xếp theo trình tự thời gian.
            for (var i=0; i<$rootScope.recent.length; i++) {
                for (var j=0; j<$scope.recentRoomsTemp.length; j++) {
                    if ($rootScope.recent[i].roomId== $scope.recentRoomsTemp[j].id) {
                        //console.log($scope.recentRoomsTemp[j].id);
                        $rootScope.recentRooms.push($scope.recentRoomsTemp[j]);
                        break;
                    }
                }
            }
            $rootScope.allRooms= $scope.recentRoomsTemp;
            $scope.recentRooms= $rootScope.recentRooms;
        }

        //$scope.activities = Room.userActivities("213");
        $scope.reWriteLastMessengerTime= function (dateTime) {
            var rewriteNow="";
            var now= new Date();
            // chuyển giá trị dateTime trả về từ server thành GMT+7(local timezone) từ giá trị GMT+0
            var messTime= new Date(dateTime);
            var returnTime= messTime.getHours() +":" 
                    +((messTime.getMinutes()<10) ?('0'+messTime.getMinutes()) :(messTime.getMinutes()));
            if (messTime.getDate()!= now.getDate() ||
                messTime.getMonth()!= now.getMonth() ||
                messTime.getFullYear()!= now.getFullYear()) {
                returnTime+= "  " +messTime.getDate() +"/" +(messTime.getMonth()+1);
            }
            return returnTime;
        }

        $scope.remove = function (item) {
            Room.remove(item);
            console.log("removed");
        };

        $scope.friends = User;
    })

    .controller('RoomCtrl', function ($rootScope, $scope, $stateParams, Socket, Room, Chat) {
        $scope.allRooms= $rootScope.allRooms;
        //$scope.room.settingURL= "";
        //console.log($stateParams.roomId);
        
        if ($stateParams.roomId == "new") {
            if ($stateParams.userList) {
                $scope.room = Room.newGroup($stateParams.groupName, $stateParams.userList);
                $scope.room.settingURL = "#/room-setting/new/" + $stateParams.groupName + "/" + $stateParams.userList;
            } else {
                $scope.room = Room.newRoom($stateParams.userId);
                $scope.room.settingURL = "#/room-setting/new/" + $stateParams.userId;
            }
        }
        else {
            for (var i=0; i< $scope.allRooms.length; i++) {
                if ($stateParams.roomId== $scope.allRooms[i].id) {
                    $scope.room= $scope.allRooms[i];
                    //console.log($scope.room);
                    $scope.room.settingURL = "#/room-setting/" + $stateParams.roomId;
                    break;
                }
            }

            // $scope.room= $scope.fullData[0].group_room[0].rooms;
            // $scope.room.settingURL = "#/room-setting/" + $stateParams.roomId;
        }

        //$scope.chatList = Chat.getByRoom($scope.room.id);
        $scope.chatList= $scope.room.chats;
        // chuyển toàn bộ dữ liệu của phần chat lấy được trên server sang cho chats bên services.js
        Chat.set($scope.chatList);

        //  KẾT NỐI ĐẾN SERVER ĐỂ VÀO ĐƯỢC PHÒNG CHAT.
        var self=this;
        var typing = false;
        var lastTypingTime;
        var TYPING_TIMER_LENGTH = 400;    

        Socket.on('connect',function(){
            connected = true
         
            //Add user
            Socket.emit('add user', "huy", $stateParams.roomId);

            // On login display welcome message
            Socket.on('login', function (data) {
            //Set the value of connected flag
            self.connected = true
          })
        })

        Socket.on('new message', function (data) {
            if(data.message&&data.username)
            {
                var userId= 1;
                var chatText= data.message;
                Chat.add(chatText, $stateParams.roomId, userId);
                $scope.chatList = Chat.getByRoom($stateParams.roomId);
                resortRecent($stateParams.roomId);
            }
        });

        $scope.sendChat = function (chatText) {
            Socket.emit('new message', chatText)
            Chat.add(chatText, $stateParams.roomId, "213");
            $scope.chatList = Chat.getByRoom($stateParams.roomId);
            resortRecent($stateParams.roomId);
        };

        function resortRecent (roomId) {
            $rootScope.recent[3].roomId= $rootScope.recent[2].roomId;
            $rootScope.recent[2].roomId= $rootScope.recent[1].roomId;
            $rootScope.recent[1].roomId= $rootScope.recent[0].roomId;
            $rootScope.recent[0].roomId= roomId;
            console.log("call resort");
            $rootScope.$emit("CallSortRoomsInActivitiesCtrl");
        }

    })

    .controller('GroupsCtrl', function ($rootScope, $scope, $stateParams, Room) {
        //console.log("GroupsCtrl");
        $scope.fullData= $rootScope.fullData;
        $scope.members= $rootScope.peopleInGroup;
        //console.log($scope.members);
        $scope.membersInGroup= [];
        for (var i= 0; i< $scope.members.length; i++) {
            if ($scope.members[i].groupId==$stateParams.groupId) {
                $scope.membersInGroup.push($scope.members[i]);
            }
        }
    })

    .controller('RoomsCtrl', function ($rootScope, $scope, $stateParams) {
        $scope.fullData= $rootScope.fullData;
        for (var i=0; i<$scope.fullData.length; i++) {
            if ($stateParams.groupId== $scope.fullData[i].id) {
                $scope.group= $scope.fullData[i];
                //$scope.room.settingURL = "#/room-setting/" + $stateParams.roomId;
                break;
            }
        }
    })

    .controller('FriendsCtrl', function ($scope, $stateParams, $ionicPopup, User, Room, $state) {

        $scope.fullData= sharedProperties.getObject();
        $scope.$state = $state;
        $scope.friends = User.myFriends("213");


        for (var i in $scope.friends) {
            var room = Room.getByUserId($scope.friends[i].id);

            $scope.friends[i].room = room;
        }

        // add contact
        $scope.showPromptAdd = function () {
            $ionicPopup.prompt({
                    title: 'Add Contact',
                    template: 'Enter someone\'s email to find them on Messenger',
                    inputType: 'email',
                    inputPlaceholder: 'Email',
                    cancelType: 'button-clear',
                    okText: 'Save',
                    okType: 'button-clear'
                }
            ).
                then(function (res) {
                    console.log('Your password is', res);
                });
        }
    })

    .controller('AccountCtrl', function ($scope, $ionicActionSheet, $ionicModal) {
        $scope.showNotification = function () {

            $ionicActionSheet.show({
                buttons: [
                    { text: 'Turn off for 15min' },
                    { text: 'Turn off for 1h' },
                    { text: 'Turn off for 8h' },
                    { text: 'Turn off for 24h' },
                    { text: 'Until I turn it back on' }
                ],
                titleText: 'Notifications',
                cancelText: 'Cancel',
                cancel: function () {
                    // add cancel code..
                },
                buttonClicked: function (index) {
                    return true;
                }
            });
        };

        $scope.showSync = function () {

            $ionicActionSheet.show({
                buttons: [
                    { text: 'Stop Syncing' }
                ],
                titleText: 'Stop syncing your phone contacts？',
                cancelText: 'Cancel',
                cancel: function () {
                    // add cancel code..
                },
                buttonClicked: function (index) {
                    return true;
                }
            });
        };

        // edit modal
        $scope.showEdit = function () {

            var hideSheet = $ionicActionSheet.show({
                buttons: [
                    { text: 'Change email' }
                ],
                cancelText: 'Cancel',
                cancel: function () {
                    // add cancel code..
                },
                buttonClicked: function (index) {
                    if (index == 0) {
                        $scope.changeEmailmodal.show();
                        hideSheet();
                    }
                }
            });
        };

        // change email modal
        $ionicModal.fromTemplateUrl('templates/modal/change-email.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.changeEmailmodal = modal;
        });
        $scope.openChangeEmail = function () {
            $scope.changeEmailmodal.show();
        };
        $scope.closeChangeEmail = function () {
            $scope.changeEmailmodal.hide();
        };
    })

    .controller('RoomSettingCtrl', function ($scope, $ionicActionSheet, $stateParams, $ionicPopup, Room) {
        if ($stateParams.roomId == "new") {
            if ($stateParams.userList) {
                $scope.room = Room.newGroup($stateParams.groupName, $stateParams.userList);
            } else {
                $scope.room = Room.newRoom($stateParams.userId);
            }
        }
        else {
            $scope.room = Room.get($stateParams.roomId);
        }

        $scope.setNotification = function () {

            $ionicActionSheet.show({
                buttons: [
                    { text: 'Turn off for 15min' },
                    { text: 'Turn off for 1h' },
                    { text: 'Turn off for 8h' },
                    { text: 'Turn off for 24h' },
                    { text: 'Until I turn it back on' }
                ],
                titleText: 'Mute notification for this conversation',
                cancelText: 'Cancel',
                cancel: function () {
                    // add cancel code..
                },
                buttonClicked: function () {
                    return true;
                }
            });
        };

        // A confirm
        $scope.showConfirmLeave = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Leave Group?',
                template: 'This conversation will be archived, and you won\'t get any new message.',
                cancelText: 'Cancel',
                cancelType: 'button-clear',
                okText: 'Leave',
                okType: 'button-clear'
            });
            confirmPopup.then(function (res) {
                if (res) {
                    console.log('Leave');
                } else {
                    console.log('Stay');
                }
            });
        };
    })

    .controller('UserSettingCtrl', function ($scope, $stateParams, $ionicPopup, User) {
        $scope.user = User.get($stateParams.userId);

        // A confirm
        $scope.showConfirmRemove = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Remove This Person?',
                template: 'They won\'t be able to keep chatting with this group.',
                cancelText: 'Cancel',
                cancelType: 'button-clear',
                okText: 'Remove',
                okType: 'button-clear'
            });
            confirmPopup.then(function (res) {
                if (res) {
                    console.log('Remove');
                } else {
                    console.log('Keep');
                }
            });
        };
    })

    .controller("DisableCtrl", function($scope) {
        $scope.thetext = "";
        $scope.b1 = function() {
            console.log("B1");
        };
        $scope.b2 = function() {
            console.log("B2");
        };
    })

    
    .controller("LoginCtrl", function($rootScope, $scope, $location, Login, md5) {
        $scope.loginData={};
        $scope.login= function() {
            var ema= $scope.loginData.email;
            var pas= md5.createHash($scope.loginData.password);
            Login.sendData(ema, pas).then(function(data){
                //console.log(data[0].userId);
                if (data== "404 Not Found") {
                    alert("Can't connect to database, please reconnect later...");
                }
                else {
                    if (data== "Wrong") {

                    }
                    else {
                        //console.log(data);
                        $rootScope.userId= data[0].userId;
                        $location.path("/tab/activities");
                    }
                }
            });
        };
    });