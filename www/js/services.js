//var DOMAIN="http://192.168.0.103:8028/";
var DOMAIN="http://localhost:8028/";
//var DOMAIN="http://:8028/";

// Users
angular.module('starter.services', ['ionic', 'ngSanitize','btford.socket-io'])
    .factory('StorageData', function () {
        var data;
        return {
            getData: function () {
                return data;
            },
            saveData: function (dataIn) {
                data= dataIn;
            }
        };
    })

    .factory('ConnectServer', function ($http, StorageData) {
        return {
            getAll: function (userId) {
                var data= {'id': userId};
                return $http.post(DOMAIN+"all", data).then(function (response) {
                    console.log(response.data);
                    return response.data;
                });
            },
            newGroup: function (data) {
                return $http.post(DOMAIN+"newGroup", data).then(function (response) {
                    return response.data;
                });
            },
            newTopic: function (data) {
                return $http.post(DOMAIN+"newTopic", data).then(function (response) {
                    return response.data;
                });
            }
        }
    })

    .factory('Login', function ($http) {
        return {
            sendData: function (ema, pas) {  
                var data= {'email':ema, 'pass':pas};
                //console.log(data);
                return $http.post(DOMAIN+"login", data).then(function (response) {
                    return response.data;
                });
            }
        }
    })

    .factory('Socket', function (socketFactory){
        //Create socket and connect to localhost        
        var myIoSocket = io.connect(DOMAIN);
        mySocket = socketFactory({
            ioSocket: myIoSocket
        });
        return mySocket;
    })

    .factory('User', ['StorageData', function (StorageData) {
        return {
            getUserInfo: function (id) {
                var users= StorageData.getData().users;
                for (var i in users) {
                    if (users[i].id== id) {
                        return users[i];
                    }
                }
            }
        }
    }])

    .factory('Group', ['StorageData', function (StorageData) {
        var groupsIdOfUser= '+';
        function returnGroups (groupsId) {
            var groups_topics= StorageData.getData().groups_topics;
            var groups= [];
            for (var i in groups_topics) {
                var regexString= ('\\+' +groups_topics[i].id +'\\+');
                var regex= new RegExp(regexString, 'g');
                if (groupsId.match(regex)!=null) {
                    groups.push(groups_topics[i]);
                }
            }
            return groups;
        }
        return {
            getFriendGroups: function (id) {
                var group_group= StorageData.getData().group_group;
                var idList= '+';
                for (var i in group_group) {
                    if (group_group[i].firstGroupId== id) {
                        idList+= (group_group[i].secondGroupId +'+');
                    }
                    else {
                        if (group_group[i].secondGroupId== id) {
                            idList+= (group_group[i].firstGroupId +'+');
                        }
                    }
                }
                return returnGroups(idList);
            },
            getGroupById: function (id) {
                var groups_topics= StorageData.getData().groups_topics;
                for (var i in groups_topics) {
                    if (groups_topics[i].id== id) {
                        return groups_topics[i];
                    }
                }
            },
            getGroupsOfUser: function (userId) {
                var group_user= StorageData.getData().group_user;
                for (var i in group_user) {
                    if (userId== group_user[i].userId) {
                        groupsIdOfUser+= (group_user[i].groupId +'+');
                    }
                }
                return returnGroups(groupsIdOfUser);
            },
            getSuggestGroups: function () {
                var group_group= StorageData.getData().group_group;
                var suggestGroupsId= '+';
                //console.log(groupsIdOfUser);
                for (var i in group_group) {
                    var regexString1= ('\\+' +group_group[i].firstGroupId +'\\+');
                    var regex1= new RegExp(regexString1, 'g');
                    var regexString2= ('\\+' +group_group[i].secondGroupId +'\\+');
                    var regex2= new RegExp(regexString2, 'g');
                    if (groupsIdOfUser.match(regex1)!= null) {
                        if (groupsIdOfUser.match(regex2)== null) {
                            suggestGroupsId+= (group_group[i].secondGroupId +'+');
                        }
                    }
                    else {
                        if (groupsIdOfUser.match(regex2)!= null) {
                            if (groupsIdOfUser.match(regex1)== null) {
                                suggestGroupsId+= (group_group[i].firstGroupId +'+');
                            }
                        }
                    }
                }
                var len= (suggestGroupsId.match(/\+[0-9]*/g).length- 1);
                if (len< 3) {
                    var groups= StorageData.getData().groups_topics;
                    for (var i in groups) {
                        len= (suggestGroupsId.match(/\+[0-9]*/g).length- 1);
                        if (len< 3) {
                            var regexString= '\\+' +groups[i].id +'\\+';
                            var regex= new RegExp(regexString);
                            if (suggestGroupsId.match(regex)==null && groupsIdOfUser.match(regex)==null) {
                                suggestGroupsId+= (groups[i].id +'+');
                            }
                        }
                        else {
                            break;
                        }
                    }
                }
                return returnGroups(suggestGroupsId);
            }
        }
    }])

    // Topics
    .factory('Topic', ['User', 'Chat', 'StorageData', function (User, Chat, StorageData) {
        var bookmarkTopics= [];
        var recentTopics= [];
        var topics= [];
        return {
            getRecentTopcis: function (userId) {
                var groups_topics= StorageData.getData().groups_topics;
                var regexString= '';
                var regex;
                var groupsIdOfUser= '+';
                var bookmarkTopicsIdOfUser= '+';
                bookmarkTopics= [];
                recentTopics= [];
                topics= [];
                
                // đưa những nhóm của người dùng vào string
                var temp= StorageData.getData().group_user;
                for (var i in temp) {
                    if (userId== temp[i].userId) {
                        groupsIdOfUser+= (temp[i].groupId +'+');
                    }
                }
                // đưa những topic được bookmark của người dùng vào string
                temp= StorageData.getData().bookmark;
                for (var i in temp) {
                    bookmarkTopicsIdOfUser+= (temp[i].topicId +'+');
                }
                var topicsIdOfUser= '+';
                for (var i in groups_topics) {
                    for (var j in groups_topics[i].topics) {
                        // đưa những tất cả topic vào mảng
                        topics.push(groups_topics[i].topics[j]);
                        var regexString= ('\\+' +groups_topics[i].id +'\\+');
                        var regex= new RegExp (regexString);
                        if (groupsIdOfUser.match(regex)!= null) {
                            topicsIdOfUser+= (groups_topics[i].topics[j].id +'+');
                        }
                        // đưa những topic được bookmark vào mảng
                        regexString= ('\\+' +groups_topics[i].topics[j].id +'\\+');
                        //console.log (bookmarkTopicsIdOfUser +", " +regexString);
                        regex= new RegExp (regexString);
                        if (bookmarkTopicsIdOfUser.match(regex)!= null) {
                            bookmarkTopics.push(groups_topics[i].topics[j]);
                        }
                    }
                }
                // đưa ra danh sách của mảng đã xếp theo thứ tự recent
                temp= StorageData.getData().topicchats;
                var recentTopicId= '+';
                for (var i= temp.length-1; i>=0; i--) {
                    regexString= ('\\+' +temp[i].toTopicId +'\\+');
                    regex= new RegExp (regexString);
                    if (topicsIdOfUser.match(regex)!=null && recentTopicId.match(regex)==null) {
                        if (recentTopicId.match(/\+[0-9]*/g).length<6) {
                            recentTopicId+= (temp[i].toTopicId +'+');   
                        }
                        else {
                            break;
                        }
                    }
                }
                recentTopicId= recentTopicId.match(/\+[0-9]*/g).map(function(data){return data.replace('+', '')});
                //console.log(recentTopicId);
                for (var i in recentTopicId) {
                    for (var j in topics) {
                        if (recentTopicId[i]== topics[j].id) {
                            recentTopics.push(topics[j])
                        }
                    }
                }
                return recentTopics;
            },
            getBookmarkTopics: function () {
                return bookmarkTopics;
            },
            getTopics: function () {
                return topics;
            },

            // for tab-activities
            userActivities: function (userId) {
                return null;
            },
            newRoom: function(userId){
                var user = User.get(userId);
                var newRoom = {
                    id: "",
                    roomType: "fb_friend",
                    thumbnail: user.face,
                    title: user.name,
                    members: user.name + ", Diamond",
                    activeTime: "Now",
                    userList: ["213", user.id]
                };
                return newRoom;
            },
            newGroup: function(groupName, UserList){
                var userList = UserList.split("+");
                var newRoom = {
                    id: "",
                    roomType: "group",
                    thumbnail: "img/placeholder.png",
                    title: groupName,
                    members: "",
                    activeTime: "Now",
                    userList: userList
                };
                newRoom.user = [];
                for (var j = 0; j < userList.length; j++) {
                    newRoom.user.push(User.get(userList[j]));
                }
                return newRoom;
            }
        };
    }])

    // Chats
    .factory('Chat', ['StorageData', function (StorageData) {
        var lastMess;

        return {
            getLengthOfChats: function () {
                return StorageData.getData().topicchats.length;
            },
            getLastMessageText: function (topicId) {
                var returnMess= "";
                lastMess= null;
                var chats= StorageData.getData().topicchats;
                if (chats== null) {
                    return "No recent chat.";
                }
                for (var i=(chats.length-1); i>=0; i--) {
                    if (chats[i].toTopicId== topicId) {
                        //console.log('true');
                        lastMess= chats[i];
                        break;
                    }
                }
                // trong trường hợp không tìm được tin nhắn (room vừa mới tạo chưa có nội dung chat) trả về giá trị rỗng
                if (lastMess== null) {
                    return "No recent chat.";
                }
                var users= StorageData.getData().users;
                for (var i in users) {
                    if (users[i].id== lastMess.userId) {
                        returnMess+= (users[i].firstName +" " +users[i].lastName 
                                        +": " +lastMess.chatText);
                        break;
                    }
                }
                return returnMess;
            },
            getLastMessageTime: function (topicId) {
                // trong trường hợp không tìm được tin nhắn (room vừa mới tạo chưa có nội dung chat) trả về giá trị rỗng
                if (lastMess== null) {
                    return "";
                }
                var dateTime= lastMess.dateTime;
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
            },
            add: function (chat) {
                var data= StorageData.getData();
                data.topicchats[data.topicchats.length]= chat;
                StorageData.saveData(data);
            },
            getChatList: function (id) {
                var chats= StorageData.getData().topicchats;
                var chatList = [];
                for (var i in chats) {
                    if (chats[i].toTopicId == id) {
                        //chats[i].user = User.get(chats[i].userId);
                        chatList.push(chats[i]);
                    }
                }
                return chatList;
            }
        };
    }]);

   