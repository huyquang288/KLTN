angular.module('starter.controllers', ['ngSanitize', 'ionic', 'ngSanitize', 'btford.socket-io', 'angular-md5'])

    // MainCtrl được gọi đầu tiên khi ng dùng TRUY CẬP VÀO TRANG LOGIN
    .controller('MainCtrl', function ($scope, $stateParams, StorageData, Socket, ConnectServer, User, Chat, Topic, Group, $ionicModal, $location, $rootScope, $ionicPopup, $state) {
        //console.log('main ctrl');
        $scope.userId= $rootScope.userId;
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
                    body: notiBody
                });
                notification.onclick = function () {
                    //$state.go('topic/');
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
                Group.setGroup(data.id, data.name);
                User.setGroupUser(data.userList, data.id);
                // gửi thông báo reload dữ liệu
                $rootScope.$broadcast("reload groups");
                $rootScope.$broadcast("reload users");
                
                var temp= data.userList.split('+')
                var user= User.getUserInfo(temp[temp.length-1]);
                temp= user.firstName +' ' +user.lastName +' added you to \'' +data.name +'\' group.';
                $rootScope.pushNotification('New Group', temp, '/rooms/'+data.id)
            }
        });

        Socket.on('created new topic', function (data) {
            if (Group.userIsBelong(data.groupId, $rootScope.userId) == 'true') {
                Topic.newTopic(data);
                $rootScope.$broadcast("reload topics");
                var body= Group.getGroupById(data.groupId).name +' was created \'' +data.title +'\' topic';
                $rootScope.pushNotification('New Topic', body, '/topic/' +data.id);
            }
        });

        Socket.on('created new tag', function (data) {
            var list= data.groupList.split('+');
            var groupsName= '';
            for (var i in list) {
                if (Group.userIsBelong(list[i], $rootScope.userId) == 'true') {
                    if (groupsName=='') {
                        groupsName= ('Your group(s): \'' +Group.getGroupById(list[i]).name);
                    } else {
                        groupsName+= (', ' +Group.getGroupById(list[i]).name);
                    }
                }
            }
            if (groupsName!= '') {
                Group.setTag(data);
                $rootScope.$broadcast("reload recent");
                $rootScope.$broadcast("reload topics");
                var body=  groupsName +'\' was taged in \'' +Topic.getTopicById(data.topic).title +'\' topic';
                $rootScope.pushNotification('New Tag', body, '/topic/' +data.topic);
            }
        });
        
        Socket.on('created new friend request', function (data) {
            Group.setGrGr(data);
            $rootScope.$broadcast("reload groups");
        });

        // nhận mess từ server gửi xuống, kiểm tra xem tin nhắn đó có thuộc nhóm mà người dùng có trong đó hay không.
        Socket.on('server new topic message', function (data) {
            Chat.add(data);
            var temp = window.location.href.match(/topic\/[0-9]*/g);
            if (temp!= null) {
                if (temp[0].replace(/[a-z]|\//g, '') == data.toTopicId) {
                    $rootScope.$broadcast("have a new message");
                    return;
                }
            }
            else {
                if (Topic.isRelation(data.toTopicId)) {
                    $rootScope.$broadcast("have a new message");
                    $rootScope.pushNotification(Topic.getTopicById(data.toTopicId).title, User.getUserInfo(data.userId).firstName +': ' +data.chatText, 'topic/'+data.toTopicId);    
                }
            }
        });
        
        // IMPORTANT
        // for tab-account and sign-up-success






        // for new-group
        $scope.createNewGroup = function (groupName) {
            var groupUserList = "";
            for (var i in $scope.users) {
                if ($scope.users[i].checked) {
                    if (!groupUserList) {
                        groupUserList = $scope.users[i].id;
                    }
                    else {
                        groupUserList += ("+" + $scope.users[i].id);
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
                for (var i = 0; i < $scope.users.length; i++) {
                    $scope.users[i].checked = '';
                }
                var roomData= {'name': groupName, 'userList': groupUserList};
                ConnectServer.newGroup(roomData).then(function (data) {
                    // lưu thông tin về phòng mới được tạo vào máy.
                    Group.setGroup(data, groupName);
                    User.setGroupUser(groupUserList, data);
                    // gửi thông báo reload dữ liệu
                    $rootScope.$broadcast("reload groups");
                    $rootScope.$broadcast("reload users");
                    // push
                    groupData= {'name': groupName, 
                               'userList': groupUserList, 
                               'id': data};
                    Socket.emit('new group', groupData);
                    $location.path("/topics/" + data);
                })
            }
        }

        // for tag-group
        $scope.tagGroup = function () {
            var groupList = "";
            for (var i in $scope.groups) {
                if ($scope.groups[i].checked) {
                    if (!groupList) {
                        groupList = $scope.groups[i].id;
                    }
                    else {
                        groupList += ("+" + $scope.groups[i].id);
                    }
                }
            }
            if (groupList.toString().split("+").length > 2) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Please Add Less Groups',
                    template: 'Please add less than 3 groups for once.',
                    okType: 'button-clear'
                });
                return;
            }
            else {
                for (var i = 0; i < $scope.groups.length; i++) {
                    $scope.groups[i].checked = '';
                }
                var data= {'topic': $stateParams.topicId, 'groupList': groupList.toString()};
                ConnectServer.newTag(data).then(function (re) {
                    // lưu thông tin về phòng mới được tạo vào máy.
                    Group.setTag(data);
                    // push
                    Socket.emit('new tag', data);
                    $scope.closeTagGroup()
                });
            }
        }

        // for send-friend-group
        $scope.sendRequest = function () {
            var groupList = "";
            for (var i in $scope.groups) {
                if ($scope.groups[i].checked) {
                    if (!groupList) {
                        groupList = $scope.groups[i].id;
                    }
                    else {
                        groupList += ("+" + $scope.groups[i].id);
                    }
                }
            }
            if (groupList.toString().split("+").length > 2) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Please Add Less Groups',
                    template: 'Please add less than 3 groups for once.',
                    okType: 'button-clear'
                });
                return;
            }
            else {
                for (var i = 0; i < $scope.groups.length; i++) {
                    $scope.groups[i].checked = '';
                }
                var data= {'group': $stateParams.groupId, 'groupList': groupList.toString()};
                ConnectServer.newFriendRequest(data).then(function (re) {
                    // lưu thông tin về phòng mới được tạo vào máy.
                    Group.setGrGr(data);
                    $rootScope.$broadcast("reload groups");
                    // push
                    Socket.emit('new group friend request', data);
                    $scope.closeSendRequest();
                });
            }
        }

        // for create-topic
        $scope.createNewTopic = function (topicName) {
            if (!topicName) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Name this topic',
                    template: 'To create the topic, please name it first. (Only you can change the name later.)',
                    okType: 'button-clear'
                });
            }
            // post data to server
            else {
                var data= {
                    title: topicName,
                    type: ($scope.isDisp==true ?0 :1),
                    thumbnail: '',
                    groupId: $stateParams.groupId
                };
                ConnectServer.newTopic(data).then(function (res) {
                    // lưu thông tin về topic vừa tạo vào máy.
                    data.id= res;
                    Topic.newTopic(data);
                    $rootScope.$broadcast("reload topics");
                    // emit lên cho người dùng khác được biết về phòng được tạo.
                    Socket.emit('new topic', data);
                    $location.path("/topic/" + res);
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
            $scope.users = User.getUsers();
            $scope.userId= $rootScope.userId;
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
            $scope.users = User.getUsers();
            $scope.userId= $rootScope.userId;
            $scope.newGroupModal.show();
        };
        $scope.closeNewGroup = function () {
            $scope.newGroupModal.hide();
        };

        // tag-group modal
        $ionicModal.fromTemplateUrl('templates/modal/tag-group.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.tagGroupModal = modal;
        });
        $scope.openTagGroup = function () {
            //console.log($stateParams.topicId)
            $scope.groups = Group.getGroupsForTag($stateParams.topicId);
            $scope.tagGroupModal.show();
        };
        $scope.closeTagGroup = function () {
            $scope.tagGroupModal.hide();
        };
        $scope.userNames= function (id) {
            return User.getUserNamesInGroup(id);
        }

        // new-topic modal
        $scope.categories = [       
            { id: 0, name: "Private"},
            { id: 1, name: "Public"}
        ];
        $scope.itemSelected = $scope.categories[1];
        $ionicModal.fromTemplateUrl('templates/modal/new-topic.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.newTopicModal = modal;
        });
        $scope.isDisp= false;
        $scope.openNewTopic = function () {
            $scope.newTopicModal.show();
        };
        $scope.closeNewTopic = function () {
            $scope.newTopicModal.hide();
        };
        $scope.onCategoryChange = function (item) {
            if (item.id==0) {
                $scope.isDisp= true;
            }
            else {
                $scope.isDisp= false;
            }
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
            $scope.users= User.getUserForAddPeople($stateParams.groupId);
        };
        $scope.closeAddPeople = function () {
            $scope.addPeopleModal.hide();
        };

        // send-request modal
        $ionicModal.fromTemplateUrl('templates/modal/send-request-group.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.sendRequestModal = modal;
        });
        $scope.openSendRequest = function () {
            $scope.sendRequestModal.show();
            $scope.groups= Group.getGroupsForSendRequest($stateParams.groupId);
        };
        $scope.closeSendRequest = function () {
            $scope.sendRequestModal.hide();
        };

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
            if ($scope.newTopicModal) {
                $scope.closeNewTopic();
            }
            if ($scope.newChatmodal) {
                $scope.closeNewChat();
            }
        });
    })

    // ActivitiesCtrl được gọi tiếp theo, sau MainCtrl. ActivitiesCtrl được gọi khi người dùng đăng nhập thành công, truy cập vào trang Recent
    .controller('ActivitiesCtrl', function ($rootScope, $scope, ConnectServer, StorageData, Socket, Topic, User, Chat) {
        //console.log('activities ctrl');
        // lấy dữ liệu từ server về sau khi đăng nhập thành công...
        var userId= $rootScope.userId;
        if (userId!="" && userId!=undefined) {
            ConnectServer.getAll(userId).then(function (data) {
                StorageData.saveData (data);
                StorageData.rewriteData();
                $rootScope.user= User.getUserInfo(userId);
                getRecentTopcis();
                getBookmarkTopics();
            });
        }

        // add user sau khi đăng nhập thành công để có thể thêm được những đoạn thông tin mới vào, cần đưa người dùng vào 1 phòng để nhận thông báo, mặc định là phòng 08281994
        Socket.on('connect', function (){
            Socket.emit('user join to topic', 08281994, userId);
        });

        $rootScope.$on("have a new message", function (event, args) {
            getRecentTopcis();
            getBookmarkTopics();
        });
        $rootScope.$on("reload recent", function (event, args) {
            getRecentTopcis();
            getBookmarkTopics();
        });
        $rootScope.$on("reload bookmark", function (event, args) {
            getBookmarkTopics();
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

    .controller('TopicCtrl', function ($rootScope, $scope, $stateParams, $ionicPopup, Socket, Topic, Chat, Group) {
        $scope.face= ($rootScope.user) ?$rootScope.user.face :'img/icon/male.jpg';
        $scope.userId= $rootScope.userId;
        var topics= Topic.getTopics();
        $scope.typingList= [];
        
        for (var i=0; i< topics.length; i++) {
            if ($stateParams.topicId== topics[i].id) {
                $scope.topic= topics[i];
                groupId= Topic.getGroupOfTopic($stateParams.topicId);
                if (Group.userIsBelong(groupId, $rootScope.userId)== 'true') {
                    $scope.topic.settingURL = "#/topic-setting/" + $stateParams.topicId;    
                }
                else {
                    $scope.topic.settingURL = '';
                }
                $scope.chatList= Chat.getChatList($stateParams.topicId);
                Socket.emit('user join to topic', $stateParams.topicId, $scope.userId);
                break;
            }
        }

        $scope.isBookmark= function (id) {
            return Topic.isBookmark(id);
        };
        $scope.pin= function (id) {
            var state= (Topic.isBookmark(id)==true ?'Unbookmark' :'Bookmark');
            var confirmPopup = $ionicPopup.confirm({
                title: (state +' this topic'),
                template: 'Are you sure?'
            });
            confirmPopup.then(function(res) {
                if(res) {
                    //console.log('Sure!');
                    Socket.emit('bookmark', {state: state, userId: $scope.userId, topicId: id});
                    if (state=='Bookmark') {
                        Topic.addBookmark ($scope.userId, id)
                    }
                    else {
                        Topic.removeBookmark ($scope.userId, id);
                    }
                    Topic.getRecentTopcis($scope.userId);
                    $rootScope.$broadcast("reload bookmark");
                }
            });
        };

        $scope.sendChat = function (chatText) {
            var chat= {chatText: chatText, toTopicId: $stateParams.topicId, userId: $scope.userId, userAvata: $scope.face, dateTime: new Date()}
            Socket.emit('client new message', chat);
            chat.id= Chat.getLengthOfChats();
            Chat.add(chat);
            $rootScope.$broadcast("reload recent");
            $scope.chatList= Chat.getChatList($stateParams.topicId);
        };

        $rootScope.$on("have a new message", function (event, args) {
            $scope.chatList= Chat.getChatList($stateParams.topicId);
        });

        // IS TYPING
        var TYPING_TIMER_LENGTH = 750; // ms
        var typing= false;
        var lastTypingTime= (new Date()).getTime();
        $scope.inputChange = function () {
            var typingData= {topicId: $stateParams.topicId, 
                            userName: $rootScope.user.firstName +' ' +$rootScope.user.lastName}
            if (!typing) {
                typing= true;
                Socket.emit('typing', typingData);
            }
            lastTypingTime= (new Date()).getTime();
            setTimeout(function () {
                var now = (new Date()).getTime();
                var timeDiff = now - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    Socket.emit('stop typing', typingData);
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
        Socket.on('stop typing', function (data) {
            var pos= $scope.typingList.indexOf(data +' is typing...');
            if (pos > -1) {
                $scope.typingList.splice(pos, 1);
            }
        });
        Socket.on('typing', function (data) {
            $scope.typingList.push(data +' is typing...');
        });
    })

    .controller('GroupsCtrl', function ($rootScope, $scope, $stateParams, StorageData, Group, User) {
        $scope.userId= $rootScope.userId;
        getGroups();
        if ($stateParams.groupId) {
            $scope.group= Group.getGroupById($stateParams.groupId);
            $scope.members= User.getMembers($stateParams.groupId);
        }
        $rootScope.$on("reload groups", function (event, args) {
            getGroups();
        });
        $rootScope.$on("reload users", function (event, args) {
            if ($stateParams.groupId) {
                $scope.members= User.getMembers($stateParams.groupId);
            }
        });
        function getGroups () {
            $scope.groupsOfUser= Group.getGroupsOfUser($rootScope.userId);
            $scope.suggestGroups= Group.getSuggestGroups();
        }

        $scope.lastActive= function (id) {
            return User.getLastTimeActive(id);
        }
        
    })

    .controller('TopicsCtrl', function ($rootScope, $scope, $stateParams, StorageData, Group, Topic, User, Chat) {
        //console.log($stateParams.belong);
        setData($stateParams.groupId, $stateParams.belong);
        $rootScope.$on ("reload topics", function (event, args) {
            setData($stateParams.groupId, $stateParams.belong);
        });
        function setData (id, belong) {
            $scope.group= Group.getGroupById(id);
            $scope.group.belong= belong;
            $scope.friendGroups= Group.getFriendGroups(id);
        };

        $scope.isBelong= function (groupId) {
            return Group.userIsBelong(groupId, $rootScope.userId);
        };
        $scope.userNames= function (id) {
            return User.getUserNamesInGroup(id);
        };
        $scope.getLastMessageText= function (topicId) {
            return Chat.getLastMessageText(topicId);
        };
        $scope.getLastMessageTime= function (topicId) {
            return Chat.getLastMessageTime(topicId);
        };
        
    })

    .controller('FriendsCtrl', function ($rootScope, $scope, $stateParams, $ionicPopup, User) {

        $scope.users = User.getUsers();

        $scope.lastActive= function (id) {
            return User.getLastTimeActive(id);
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

    .controller('AccountCtrl', function ($rootScope, $scope, $ionicActionSheet, $ionicModal, $location, Auth, User) {
        $scope.user= User.getUserInfo($rootScope.userId);
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

        $scope.logout = function () {
            Auth.logout();
            $location.path('/login');
        }

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

    .controller('GroupSettingCtrl', function ($scope, $stateParams, $ionicPopup, Group) {
        $scope.group= Group.getGroupById($stateParams.groupId);
    })

    .controller('TopicSettingCtrl', function ($scope, $ionicActionSheet, $stateParams, $ionicPopup, Topic) {
        $scope.topic = Topic.getTopicById($stateParams.topicId);

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
   
    .controller('LoginCtrl', function ($rootScope, $scope, $location, StorageData, Login, md5, Auth) {
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
                    if (data== "Wrong") {}
                    else {
                        $rootScope.userId= data[0].userId;
                        Auth.setUser($rootScope.userId);
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