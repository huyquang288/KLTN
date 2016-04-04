angular.module('starter.controllers', ['ngSanitize', 'ionic', 'ngSanitize', 'btford.socket-io', 'angular-md5'])

    // MainCtrl được gọi đầu tiên khi ng dùng TRUY CẬP VÀO TRANG LOGIN
    .controller('MainCtrl', function ($scope, $stateParams, StorageData, Socket, ConnectServer, User, $ionicModal, $location, $rootScope, $ionicPopup) {
        var self= this;
        $scope.historyBack = function () {
            window.history.back();
        };

        // hiển thị thông báo
        $rootScope.pushNotification= function (notiTitle, notiBody, locationLink) {
            if (!Notification) {
                alert('Desktop notifications not available in your browser. Try Chromium.'); 
                return;
            }
            if (Notification.permission !== "granted")
                Notification.requestPermission();
            else {
                var notification = new Notification(notiTitle, {
                    icon: 'https://s3.amazonaws.com/ionic-marketplace/ionic-starter-messenger/icon.png',
                    body: notiBody,
                });
                notification.onclick = function () {
                    $location.path(locationLink);
                }   
            }
        }

        
            
        // nhận thông báo từ server về việc 1 group mới được tạo.
        Socket.on('added to new group', function (data){
            regexString= $rootScope.userId +"|\\+" +$rootScope.userId;
            var regex= new RegExp (regexString, "g")
            if (data.userList.match(regex)!= null) {
                //lưu nhóm mới này vào trong danh sách tất cả các nhóm.
                var allGroups= StorageData.getAllGroups();
                var ele= {
                    groupId: data.id,
                    name: data.name,
                    description: data.description
                };
                allGroups.push(ele);
                var peopleInAllGroups= StorageData.getPeopleInAllGroups();
                var ele;
                for (var i in data.allUsers) {
                    ele = {
                        userId: data.allUsers[i].userId,
                        groupId: data.id,
                        firstName: data.allUsers[i].firstName,
                        lastName: data.allUsers[i].lastName,
                        face: data.allUsers[i].face,
                        friendType: data.allUsers[i].friendType,
                        activeTime: data.allUsers[i].activeTime,
                        isAdmin: ((data.adminId==data.allUsers[i].userId) ?1 :0)
                    }
                    peopleInAllGroups.push(ele);
                }
                StorageData.setAllGroups(allGroups);
                $rootScope.$broadcast("ReloadAllGroups");
                StorageData.setPeopleInAllGroups(peopleInAllGroups);
                $rootScope.$broadcast("ReloadPeopleInAllGroups");
                if (data.adminId!= $rootScope.userId) {
                    $rootScope.pushNotification('New Group', 'You was added to \'' +data.name +'\' group.', '/rooms/'+data.id)
                }
            }
        });

        Socket.on('new topic', function (data) {
            var allGroups= StorageData.getAllGroups();
            for (var i in allGroups) {
                if (allGroups[i].groupId== data.groupId) {
                    console.log("find");
                    var allRooms= StorageData.getAllRooms();
                    allRooms.push (data);
                    StorageData.setAllRooms(allRooms);
                    $rootScope.$broadcast("ReloadAllRooms");
                    $rootScope.pushNotification('New Topic', allGroups[i].name +' was created \'' +data.title +'\' topic', '/room/' +data.roomId);
                    return;
                }
            }
        });

        // nhận mess từ server gửi xuống, kiểm tra xem tin nhắn đó có thuộc nhóm mà người dùng có trong đó hay không.
        Socket.on('server new all message', function (data) {
            var rooms= StorageData.getAllRooms();
            var topicName= '';
            for (var i in rooms) {
                if (rooms[i].roomId== data.roomId) {
                    topicName= rooms[i].title;
                    break;
                }
            }
            if (topicName!='') {
                StorageData.addChat(data.chatId, data.chatText, data.roomId, data.userId, data.dateTime, data.userAvata);
                $rootScope.pushNotification(topicName, data.chatText, '/room/'+data.roomId);
                $rootScope.$broadcast("CallSortRoomsInActivitiesCtrl");
            }
        });


        //$scope.friends = StorageData.getPeopleInAllGroups();
        //console.log($scope.friends);
        //$scope.activities = Room.userActivities("213");






        // IMPORTANT
        // for tab-account and sign-up-success
        //$scope.user = User.get("213");




        // for new-group
        $rootScope.newGroupName = '';
        $scope.createNewGroup = function (groupName) {
            var groupUserList = "";
            $scope.friends= User.getAllPeople();
            for (var i = 0; i < $scope.friends.length; i++) {
                if ($scope.friends[i].checked) {
                    if (!groupUserList) {
                        groupUserList = $scope.friends[i].userId;
                    }
                    else {
                        groupUserList += "+" + $scope.friends[i].userId;
                    }
                }
            }
            if (groupUserList.split("+").length < 2 || !groupName) {
                if (groupUserList.split("+").length < 2) {
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
                        template: 'To create the group, please name it first. (Only you can change the name later.)',
                        okType: 'button-clear'
                    });
                    return;
                }
            }
            else {
                groupUserList += "+" + $rootScope.userId;
                for (var i = 0; i < $scope.friends.length; i++) {
                    $scope.friends[i].checked = '';
                }
                $rootScope.newGroupName = '';
                var roomData= {'name': groupName, 'userList': groupUserList};
                ConnectServer.newGroup(roomData).then(function (data) {
                    // lưu thông tin về phòng mới được tạo vào máy.
                    var allGroups= StorageData.getAllGroups();
                    var peopleInAllGroups= StorageData.getPeopleInAllGroups();
                    var ele= {
                        groupId: data,
                        name: groupName,
                        description: ""
                    };
                    allGroups.push(ele);
                    // gửi lên server 1 thông báo về cho người dùng họ vừa được add vào 1 nhóm
                    var usersInGroup= [];
                    var allUsers= $scope.friends;
                    var temp= groupUserList.split("+");
                    for (var i in temp) {
                        for (var j in allUsers) {
                            if (temp[i]== allUsers[j].userId) {
                                // thêm vào dữ liệu trên máy.
                                ele = {
                                    userId: allUsers[j].userId,
                                    groupId: data,
                                    firstName: allUsers[j].firstName,
                                    lastName: allUsers[j].lastName,
                                    face: allUsers[j].face,
                                    friendType: allUsers[j].friendType,
                                    activeTime: allUsers[j].activeTime,
                                    isAdmin: 0
                                }
                                peopleInAllGroups.push(ele);
                                // thêm vào mảng để upload lên server.
                                usersInGroup.push(allUsers[j]);
                            }
                        }
                    }
                    // thêm chính mình với quyền admin do trong $scope.friend không chứa thông tin về bản thân.
                    ele = {
                        userId: $rootScope.userId,
                        groupId: data,
                        firstName: $rootScope.firstName,
                        lastName: $rootScope.lastName,
                        face: $rootScope.userAvata,
                        friendType: '',
                        activeTime: '',
                        isAdmin: 1
                    }
                    peopleInAllGroups.push(ele);
                    usersInGroup.push(allUsers[j]);
                    // save
                    StorageData.setAllGroups(allGroups);
                    $rootScope.$broadcast("ReloadAllGroups");
                    StorageData.setPeopleInAllGroups(peopleInAllGroups);
                    $rootScope.$broadcast("ReloadPeopleInAllGroups");
                    // push
                    roomData= {'name': groupName, 
                               'userList': groupUserList, 
                               'id': data,
                               adminId: $rootScope.userId,
                               allUsers: usersInGroup};
                    Socket.emit('new group', roomData);
                    $location.path("/rooms/" + data);
                })
            }
        }

        $scope.createNewTopic = function (type, topicName, icon, groupId) {
            if (!topicName) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Name This ' +type +'Topic',
                    template: 'To create the topic, please name it first. (Only you can change the name later.)',
                    okType: 'button-clear'
                });
            }
            // post data to server
            else {
                var data= {
                    newRoomData: {
                        title: topicName,
                        roomType: (type=="Public" ?1 :0),
                        thumbnail: icon
                    },
                    groupId: groupId
                };
                ConnectServer.newTopic(data).then(function (data) {
                    // lưu thông tin về topic vừa tạo vào máy.
                    var allRooms= StorageData.getAllRooms();
                    var ele= {
                        roomId: data,
                        title: topicName,
                        groupId: groupId,
                        thumbnail: icon,
                        activeTime: "",
                        isOwner: 1
                    }
                    allRooms.push(ele);
                    StorageData.setAllRooms(allRooms);
                    $rootScope.$broadcast("ReloadAllRooms");
                    // emit lên cho người dùng khác được biết về phòng được tạo.
                    Socket.emit('newTopic', ele);
                    $location.path("/room/" + data);
                });
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
            $scope.friends = User.getAllPeople($rootScope.userId);
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
            $scope.friends = User.getAllPeople($rootScope.userId);
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
    .controller('ActivitiesCtrl', function ($rootScope, $scope, ConnectServer, StorageData, Socket, Topic, Chat) {
        // lấy dữ liệu từ server về sau khi đăng nhập thành công...
        var userId= $rootScope.userId;
        if (userId!="" && userId!=undefined) {
            ConnectServer.getAll(userId).then(function (data) {
                StorageData.saveData (data);
                getRecentTopcis();
                getBookmarkTopics();
            });
        }

        // add user sau khi đăng nhập thành công để có thể thêm được những đoạn thông tin mới vào, cần đưa người dùng vào 1 phòng để nhận thông báo, mặc định là phòng 08281994
        Socket.on('connect', function (){
            Socket.emit('user join to topic', 08281994, userId);
        });

        //getRecentTopcis();
        //getBookmarkTopics();

        $rootScope.$on("CallSortRoomsInActivitiesCtrl", function (event, args){
            
        });
        
        function getRecentTopcis () {
            $scope.recentTopics= Topic.getRecentTopcis (userId);
        }
        function getBookmarkTopics () {
            $scope.bookmarkTopics= Topic.getBookmarkTopics (userId);
        }
        $scope.getLastMessageText= function (topicId) {
            return Chat.getLastMessageText(topicId);
        }
        $scope.getLastMessageTime= function (topicId) {
            return Chat.getLastMessageTime(topicId);
        }
        $scope.remove = function (item) {
            Topic.remove(item);
            console.log("removed");
        };

    })

    .controller('TopicCtrl', function ($rootScope, $scope, $stateParams, StorageData, Socket, Topic, Chat) {
        $scope.userId= $rootScope.userId;
        var topics= Topic.getTopics();
        
        if ($stateParams.topicId == "new") {
            if ($stateParams.userList) {
                $scope.topic = Topic.newGroup($stateParams.groupName, $stateParams.userList);
                $scope.topic.settingURL = "#/topic-setting/new/" + $stateParams.groupName + "/" + $stateParams.userList;
            } else {
                $scope.topic = Topic.newTopic($stateParams.userId);
                $scope.topic.settingURL = "#/topic-setting/new/" + $stateParams.userId;
            }
        }
        else {
            for (var i=0; i< topics.length; i++) {
                if ($stateParams.topicId== topics[i].id) {
                    $scope.topic= topics[i];
                    $scope.topic.settingURL = "#/topic-setting/" + $stateParams.topicId;
                    $scope.chatList= Chat.getChatList($stateParams.topicId);
                    //console.log('join to room')
                    Socket.emit('user join to topic', $stateParams.topicId, $scope.userId);
                    break;
                }
            }
        }

        $scope.sendChat = function (chatText) {
            //console.log(userAvata);
            Socket.emit('client new message', {chatText: chatText, roomId: $stateParams.roomId, userId: $scope.userId, userAvata: userAvata, userName: userName})
            Chat.addChat(0, chatText, $stateParams.roomId, userId, "now", userAvata, userName);
            
            $rootScope.$broadcast("CallSortRoomsInActivitiesCtrl");
        };

    })

    .controller('GroupsCtrl', function ($rootScope, $scope, $stateParams, StorageData, Group) {
        getGroups();
        $rootScope.$on("ReloadAllGroups", function (event, args){
            //$scope.allGroups= StorageData.getAllGroups();
            getGroups();
        });
        $rootScope.$on("ReloadPeopleInAllGroups", function (event, args){
            $scope.members= StorageData.getPeopleInAllGroups();
        });
        function getGroups () {
            $scope.groupsOfUser= Group.getGroupsOfUser($rootScope.userId);
            $scope.suggestGroups= Group.getSuggestGroups();
        }
        
    })

    .controller('TopicsCtrl', function ($rootScope, $scope, $stateParams, StorageData) {
        //console.log('room ctrl run');
        allGroups= StorageData.getAllGroups();
        allRooms= StorageData.getAllRooms();
        allPeople= StorageData.getPeopleInAllGroups();
        setData();
        $rootScope.$on ("ReloadAllGroups", function (event, args) {
            allGroups= StorageData.getAllGroups();
            setData();
        });
        $rootScope.$on ("ReloadAllRooms", function (event, args) {
            allRooms= StorageData.getAllRooms();
            setData();
        });
        $rootScope.$on ("ReloadPeopleInAllGroups", function (event, args) {
            allPeople= StorageData.getPeopleInAllGroups();
            setData();
        });
        function setData () {
            $scope.rooms= [];
            $scope.isAdmin= false;
            for (var i in allGroups) {
                if ($stateParams.groupId== allGroups[i].groupId) {
                    $scope.group= allGroups[i];
                    //$scope.room.settingURL = "#/room-setting/" + $stateParams.roomId;
                    break;
                }
            }
            for (var i in allRooms) {
                if (allRooms[i].groupId== $stateParams.groupId) {
                    $scope.rooms.push(allRooms[i]);
                }
            }
            for (var i in allPeople) {
                if (allPeople[i].groupId==$scope.group.groupId && allPeople[i].isAdmin==1 && allPeople[i].userId==$rootScope.userId) {
                    $scope.isAdmin= true;
                    //console.log("is admin");
                }
            }
        }

        
    })

    .controller('FriendsCtrl', function ($rootScope, $scope, $stateParams, $ionicPopup, StorageData, User, Room, $state) {

        $scope.fullData= $rootScope.fullData;
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
            ).then(function (res) {
                console.log('Your password is', res);
            });
        }
    })

    .controller('AccountCtrl', function ($rootScope, $scope, $ionicActionSheet, $ionicModal) {
        $scope.userName= $rootScope.userName;
        $scope.userAvata= $rootScope.userAvata;
        $scope.firstName= $rootScope.firstName;
        $scope.lastName= $rootScope.lastName;
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
                titleText: 'Stop syncing your phone contacts?',
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
                    { text: 'Change your name' }
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

    .controller('DisableCtrl', function ($scope) {
        $scope.thetext = "";
        $scope.b1 = function() {
            console.log("B1");
        };
        $scope.b2 = function() {
            console.log("B2");
        };
    })
   
    .controller('LoginCtrl', function ($rootScope, $scope, $location, StorageData, Login, md5) {
        $scope.loginData={};
        $scope.login= function() {
            var ema= $scope.loginData.email;
            var pas= md5.createHash($scope.loginData.password);
            Login.sendData(ema, pas).then(function (data){
                //console.log(data[0].userId);
                if (data== "404 Not Found") {
                    alert("Can't connect to database, please reconnect later...");
                }
                else {
                    if (data== "Wrong") {

                    }
                    else {
                        $rootScope.userId= data[0].userId;
                        $location.path("/tab/activities");
                    }
                }
            });
        };
    });

// đoạn code này để hiển thị thông báo xem người dùng có chấp nhận nhận thông báo của hệ thống ko
document.addEventListener('DOMContentLoaded', function () {
    if (Notification.permission !== "granted")
        Notification.requestPermission();
});