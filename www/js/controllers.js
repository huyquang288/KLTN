angular.module('starter.controllers', ['ngSanitize', 'ionic', 'ngSanitize', 'btford.socket-io', 'angular-md5'])

    // MainCtrl được gọi đầu tiên khi ng dùng TRUY CẬP VÀO TRANG LOGIN
    .controller('MainCtrl', function ($scope, $stateParams, StorageData, Socket, ConnectServer, User, Chat, Topic, Group, $ionicModal, Noti, $location, $rootScope, $ionicPopup, $state, $ionicScrollDelegate) {
        //console.log('main ctrl');
        $scope.userId= $rootScope.userId;
        $scope.historyBack = function () {
            window.history.back();
        };

        // hiển thị thông báo
        $rootScope.pushNotification= function (notiTitle, notiBody, locationLink) {
            var temp= {groupId: -1, topicId: -1};
            if (Noti.checkNoti(temp) == 'Off') return;
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
            var temp= data.userList.split('+');
            for (var i in temp) {
                if ($rootScope.userId == temp[i]) {
                    //lưu nhóm mới này vào trong danh sách tất cả các nhóm.
                    Group.setGroup(data.id, data.name);
                    User.setGroupUser(data.userList, data.id);
                    // gửi thông báo reload dữ liệu
                    $rootScope.$broadcast("reload groups");
                    // $rootScope.$broadcast("reload users");
                    
                    var user= User.getUserInfo(temp[temp.length-1]);
                    temp= user.firstName +' ' +user.lastName +' đã thêm bạn vào nhóm mới \'' +data.name +'\'.';
                    $rootScope.pushNotification('Nhóm mới', temp, '/topics/'+data.id)
                    break;
                }
            }
        });

        Socket.on('users added to group', function (data){
            var temp =data.userList.split('+');
            for (var i in temp) {
                if ($rootScope.userId == temp[i]) {
                    //lưu nhóm mới này vào trong danh sách tất cả các nhóm.
                    Group.addUsers(data);
                    // User.setGroupUser(data.userList, data.id);
                    // gửi thông báo reload dữ liệu
                    $rootScope.$broadcast("reload groups");
                    // $rootScope.$broadcast("reload users");
                    var gr= Group.getGroupById(data.group)
                    temp= 'Bạn đã được thêm vào nhóm \'' +gr.name +'\'.';
                    $rootScope.pushNotification('Thêm vào nhóm', temp, '/topics/'+data.group)
                    break;
                }
            }
        });

        Socket.on('created new topic', function (data) {
            var temp= {groupId: data.groupId, topicId: -1};
            if (Group.userIsBelong(data.groupId, $rootScope.userId) == 'true') {
                Topic.newTopic(data);
                $rootScope.$broadcast("reload topics");
                if (Noti.checkNoti(temp) == 'On') {
                    var body= Group.getGroupById(data.groupId).name +' đã tạo chủ đề \'' +data.title +'\'.';
                    $rootScope.pushNotification('Chủ đề mới', body, '/topic/' +data.id);
                }
            }
        });

        Socket.on('topic change privacy', function (data) {
            Topic.changePrivacy(data);
            $rootScope.$broadcast("reload groups");
            $rootScope.$broadcast("reload recent");
            $rootScope.$broadcast("reload topics");
        });

        Socket.on('created new tag', function (data) {
            var list= data.groupList.split('+');
            var groupsName= '';
            var check= false;
            for (var i in list) {
                if (Group.userIsBelong(list[i], $rootScope.userId) == 'true') {
                    if (groupsName=='') {
                        groupsName= ('Nhóm của bạn: \'' +Group.getGroupById(list[i]).name);
                    } else {
                        groupsName+= (', ' +Group.getGroupById(list[i]).name);
                    }
                    var temp= {groupId: data.groupId, topicId: -1};
                    if (Noti.checkNoti(temp) == 'On') {
                        check= true;
                    }
                }
            }
            if (groupsName!= '') {
                Group.setTag(data);
                $rootScope.$broadcast("reload recent");
                $rootScope.$broadcast("reload topics");
                if (check== true) {
                    var body=  groupsName +'\' được chia sẻ với chủ đề \'' +Topic.getTopicById(data.topic).title +'\'.';
                    $rootScope.pushNotification('Chia sẻ mới', body, '/topic/' +data.topic);
                }
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
                temp= {groupId: -1, topicId: data.toTopicId};
                // console.log(Noti.checkNoti(temp));
                if (Topic.isRelation(data.toTopicId)) {
                    $rootScope.$broadcast("have a new message");

                    if (Noti.checkNoti(temp) == 'On') {
                        $rootScope.pushNotification(Topic.getTopicById(data.toTopicId).title, User.getUserInfo(data.userId).firstName +': ' +data.chatText, 'topic/'+data.toTopicId);
                    }
                }
            }
        });
        
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
                        title: 'Vui lòng thêm người dùng',
                        template: 'Một nhóm cần có tối thiểu 3 người dùng.',
                        okType: 'button-clear'
                    });
                    return;
                }
                if (!groupName) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Tên nhóm',
                        template: 'Để tạo nhóm, vui lòng nhập tên cho nhóm. (Tên nhóm có thể thay đổi.)',
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
                    title: 'Vui lòng lựa chọn ít nhóm hơn',
                    template: 'Chỉ có thể thêm tối đa 2 nhóm.',
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
                    title: 'Vui lòng lựa chọn ít nhóm hơn',
                    template: 'Chỉ có thể thêm tối đa 2 nhóm.',
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
                    title: 'Tên chủ đề',
                    template: 'Để tạo chủ đề, vui lòng nhập tên cho chủ đề. (Tên chủ đề có thể thay đổi.)',
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
            // $scope.users = User.getUsers();
            $scope.topics= Topic.getTopics();
            // $scope.userId= $rootScope.userId;
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
        };

        // tag-group modal
        $ionicModal.fromTemplateUrl('templates/modal/taged-group.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function (modal) {
            $scope.tagedGroupModal = modal;
        });
        $scope.openTagedGroup = function () {
            //console.log($stateParams.topicId)
            $scope.groups = Group.getGroupsTaged($stateParams.topicId);
            $scope.tagedGroupModal.show();
        };
        $scope.closeTagedGroup = function () {
            $scope.tagedGroupModal.hide();
        };

        // new-topic modal
        $scope.categories = [       
            { id: 0, name: "Riêng tư"},
            { id: 1, name: "Công khai"}
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
            // console.log("change2");
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
        $scope.addPeople = function () {
            var userList = "";
            for (var i in $scope.users) {
                if ($scope.users[i].checked) {
                    // console.log('dm');
                    if (!userList) {
                        userList = $scope.users[i].id;
                    }
                    else {
                        userList += ("+" + $scope.users[i].id);
                    }
                }
            }
            if (userList.toString().split("+").length < 1) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Please Add More Users',
                    template: 'Please add more than 1 user for once.',
                    okType: 'button-clear'
                });
                return;
            }
            else {
                for (var i = 0; i < $scope.users.length; i++) {
                    $scope.users[i].checked = '';
                }
                var data= {'group': $stateParams.groupId, 'userList': userList.toString()};
                ConnectServer.addUsersToGroup(data).then(function (re) {
                    // lưu thông tin vào máy.
                    Group.addUsers(data);
                    // $rootScope.$broadcast("reload groups");
                    // push
                    Socket.emit('add users', data);
                    $scope.closeAddPeople();
                });
            }
        }

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
            $scope.topics= Topic.getTopics();
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
            $scope.groups= Group.getAllGroups();
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

    .controller('TopicCtrl', function ($rootScope, $scope, $stateParams, $ionicPopup, Socket, Topic, Chat, Group, $ionicScrollDelegate) {
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
        $ionicScrollDelegate.scrollBottom();

        $scope.isBookmark= function (id) {
            return Topic.isBookmark(id);
        };
        $scope.pin= function (id) {
            var state= (Topic.isBookmark(id)==true ?'Unbookmark' :'Bookmark');
            var confirmPopup = $ionicPopup.confirm({
                title: ((state=='Bookmark' ?'Đánh dấu' :'Bỏ đánh dấu') +' chủ đề này')
                // template: 'Are you sure?'
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
            $ionicScrollDelegate.scrollBottom();
        };

        $rootScope.$on("have a new message", function (event, args) {
            $scope.chatList= Chat.getChatList($stateParams.topicId);
            $ionicScrollDelegate.scrollBottom();
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
            // $ionicScrollDelegate.scrollBottom();
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

        $scope.getChatToUserLink= function (id, userId) {
            // console.log(id.toString() +", " +userId);
            if (id.toString()!= userId) {
                var link= id+ 19940828;
                var link= "#/topic/" +link;
                return link;
            }
            return '';
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

    .controller('AccountCtrl', function ($rootScope, $scope, $ionicActionSheet, $ionicModal, $location, $ionicPopup, Auth, User, Noti) {
        $scope.user= User.getUserInfo($rootScope.userId);
        $scope.notiStatus= (Noti.checkNoti({groupId: -1, topicId: -1}) == 'On')
                            ?'Bật' :'Tắt';
        $scope.showNotification = function () {
            $ionicActionSheet.show({
                buttons: [
                    { text: 'Bật' },
                    { text: 'Tắt trong 15 phút' },
                    { text: 'Tắt trong 1 giờ' },
                    { text: 'Tắt trong 24 giờ' },
                    { text: 'Tắt cho đến khi mở lại' }
                ],
                titleText: 'Thông báo',
                cancelText: 'Huỷ',
                cancel: function () {
                    // add cancel code..
                },
                buttonClicked: function (index) {
                    switch (index) {
                        case 0: {
                            $scope.notiStatus= 'Bật';
                            var data= {groupId: -1, topicId: -1};
                            Noti.onNoti(data);
                            break;
                        };
                        case 1: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: -1, topicId: -1, 
                                        until: (new Date()).getTime()+60000*15};
                            Noti.offNoti(data);
                            break;
                        };
                        case 2: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: -1, topicId: -1, 
                                        until: (new Date()).getTime()+60000*60};
                            Noti.offNoti(data);
                            break;
                        };
                        case 3: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: -1, topicId: -1, 
                                        until: (new Date()).getTime()+60000*60*24};
                            Noti.offNoti(data);
                            break;
                        };
                        case 4: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: -1, topicId: -1, 
                                        until: 'off'};
                            Noti.offNoti(data);
                            break;
                        };
                    }
                    return true;
                }
            });
        };


        // edit modal
        $scope.showEdit = function () {
            var hideSheet = $ionicActionSheet.show({
                buttons: [
                    { text: 'Đổi tên hiển thị' }
                ],
                cancelText: 'Huỷ',
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
            var confirmPopup = $ionicPopup.confirm({
                title: 'Đăng xuất?',
                // template: 'This conversation will be archived, and you won\'t get any new message.',
                cancelText: 'Huỷ',
                cancelType: 'button-clear',
                okText: 'Đăng xuất',
                okType: 'button-clear'
            });
            confirmPopup.then(function (res) {
                if (res) {
                    // console.log('Leave');
                    Auth.logout();
                    $location.path('/login');
                } else {
                    // console.log('Stay');
                }
            });
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

    .controller('GroupSettingCtrl', function ($rootScope, $ionicActionSheet, $scope, $stateParams, $ionicPopup, Group, ConnectServer, Noti) {
        $scope.group= Group.getGroupById($stateParams.groupId);
        $scope.notiStatus= (Noti.checkNoti({groupId: $stateParams.groupId, topicId: -1}) == 'On')
                            ?'Bật' :'Tắt';

        $scope.setNotification = function () {
            $ionicActionSheet.show({
                buttons: [
                    { text: 'Bật' },
                    { text: 'Tắt trong 15 phút' },
                    { text: 'Tắt trong 1 giờ' },
                    { text: 'Tắt trong 24 giờ' },
                    { text: 'Tắt cho đến khi mở lại' }
                ],
                titleText: 'Tắt thông báo cho nhóm này',
                cancelText: 'Huỷ',
                cancel: function () {
                    // add cancel code..
                },
                buttonClicked: function (index) {
                    switch (index) {
                        case 0: {
                            $scope.notiStatus= 'Bật';
                            var data= {groupId: $stateParams.groupId, topicId: -1};
                            Noti.onNoti(data);
                            break;
                        };
                        case 1: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: $stateParams.groupId, topicId: -1, 
                                        until: (new Date()).getTime()+60000*15};
                            Noti.offNoti(data);
                            break;
                        };
                        case 2: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: $stateParams.groupId, topicId: -1, 
                                        until: (new Date()).getTime()+60000*60};
                            Noti.offNoti(data);
                            break;
                        };
                        case 3: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: $stateParams.groupId, topicId: -1, 
                                        until: (new Date()).getTime()+60000*60*24};
                            Noti.offNoti(data);
                            break;
                        };
                        case 4: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: $stateParams.groupId, topicId: -1, 
                                        until: 'off'};
                            Noti.offNoti(data);
                            break;
                        };
                    }
                    return true;
                }
            });
        };
        // A confirm
        $scope.showConfirmLeave = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Rời khỏi nhóm?',
                template: 'Bạn sẽ không còn nhận được những tin nhắn mới từ những chủ đề thuộc nhóm này nữa.',
                cancelText: 'Huỷ',
                cancelType: 'button-clear',
                okText: 'Rời khỏi nhóm',
                okType: 'button-clear'
            });
            confirmPopup.then(function (res) {
                if (res) {
                    var data= {userId: $rootScope.userId, groupId: $stateParams.groupId};
                    ConnectServer.leaveGroup(data).then (function (res) {
                        Group.removeUsers(data);
                        $rootScope.$broadcast("reload groups");
                        window.history.back();
                    });
                } else {
                    // console.log('Stay');
                }
            });
        };
    })

    .controller('TopicSettingCtrl', function ($rootScope, $scope, $ionicActionSheet, $stateParams, $ionicPopup, Topic, Noti, Socket) {
        $scope.topic = Topic.getTopicById($stateParams.topicId);
        $scope.notiStatus= (Noti.checkNoti({groupId:-1, topicId: $stateParams.topicId}) == 'On')
                            ?'Bật' :'Tắt';
        $scope.isDisp= 1;
        $scope.setNotification = function () {

            $ionicActionSheet.show({
                buttons: [
                    { text: 'Bật' },
                    { text: 'Tắt trong 15 phút' },
                    { text: 'Tắt trong 1 giờ' },
                    { text: 'Tắt trong 24 giờ' },
                    { text: 'Tắt cho đến khi mở lại' }
                ],
                titleText: 'Tắt thông báo cho chủ đề này',
                cancelText: 'Huỷ',
                cancel: function () {
                    // add cancel code..
                },
                buttonClicked: function (index) {
                    switch (index) {
                        case 0: {
                            $scope.notiStatus= 'Bật';
                            var data= {groupId: -1, topicId: $stateParams.topicId};
                            Noti.onNoti(data);
                            break;
                        };
                        case 1: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: -1, topicId: $stateParams.topicId, 
                                        until: (new Date()).getTime()+60000*15};
                            Noti.offNoti(data);
                            break;
                        };
                        case 2: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: -1, topicId: $stateParams.topicId, 
                                        until: (new Date()).getTime()+60000*60};
                            Noti.offNoti(data);
                            break;
                        };
                        case 3: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: -1, topicId: $stateParams.topicId, 
                                        until: (new Date()).getTime()+60000*60*24};
                            Noti.offNoti(data);
                            break;
                        };
                        case 4: {
                            $scope.notiStatus= 'Tắt';
                            var data= {groupId: -1, topicId: $stateParams.topicId, 
                                        until: 'off'};
                            Noti.offNoti(data);
                            break;
                        };
                    }
                    return true;
                }
            });
        };

        $scope.onCategoryChange = function (item) {
            console.log("change1");
            if (item.id==0) {
                $scope.isDisp= 0;
            }
            else {
                $scope.isDisp= 1;
            }
        };

        $scope.saveSetting = function () {
            var confirmPopup = $ionicPopup.confirm({
                title: 'Lưu cài đặt',
                template: 'Bạn có muốn lưu lại cài đặt cho chủ đề này?',
                cancelText: 'Huỷ',
                cancelType: 'button-clear',
                okText: 'Lưu',
                okType: 'button-clear'
            });
            confirmPopup.then(function (res) {
                if (res) {
                    var data= {topicId: $stateParams.topicId, type: $scope.isDisp};
                    Topic.changePrivacy(data);
                    Socket.emit('change privacy', data);
                    $rootScope.$broadcast("reload groups");
                    $rootScope.$broadcast("reload recent");
                    $rootScope.$broadcast("reload topics");
                    window.history.back();
                } else {
                    // console.log('Keep');
                }
            });
        }

    })

    .controller('UserCtrl', function ($scope, $stateParams, User, Group) {
        $scope.user = User.getUserInfo($stateParams.userId);
        $scope.groups= Group.getGroupsOfFriend($stateParams.userId);
        $scope.userNames= function (id) {
            return User.getUserNamesInGroup(id);
        }
    })

    .controller('UserSettingCtrl', function ($scope, $stateParams, $ionicPopup, User) {
        $scope.user = User.getUserInfo($stateParams.userId);

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
        $scope.DOMAIN= DOMAIN;
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
        // $scope.setDOMAIN = function () {
        //     DOMAIN= $scope.newDOMAIN;
        //     console.log(DOMAIN);
        //     $location.path("/login");
        // };
    });

// đoạn code này để hiển thị thông báo xem người dùng có chấp nhận nhận thông báo của hệ thống ko
document.addEventListener('DOMContentLoaded', function () {
    if (Notification.permission !== "granted")
        Notification.requestPermission();
});