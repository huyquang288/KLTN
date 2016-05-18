var DOMAIN="http://192.168.100.22:8028/";
//var DOMAIN="http://192.168.0.104:8028/";
//var DOMAIN="http://localhost:8028/";
//var DOMAIN="http://:8028/";

// Users
angular.module('starter.services', ['ionic', 'ngSanitize','btford.socket-io'])
    .factory('StorageData', function () {
        var data;
        return {
            getData: function () {
                if (!data) {
                    data= JSON.parse(localStorage['ionic_data']);
                }
                return data;
            },
            saveData: function (dataIn) {
                data= dataIn;
                localStorage['ionic_data'] = JSON.stringify(data);
            },
            rewriteData: function () {
                var topics= [];
                for (var i in data.groups_topics) {
                    for (var j in data.groups_topics[i].topics) {
                        // đưa những tất cả topic vào mảng
                        //console.log(data.groups_topics[i].topics[j])
                        topics[data.groups_topics[i].topics[j].id]= JSON.parse(JSON.stringify(data.groups_topics[i].topics[j]));
                    }
                }
                for (var i in data.groups_topics) {
                    for (var j in data.tags) {
                        if (data.groups_topics[i].id== data.tags[j].groupId) {
                            if (data.groups_topics[i].topics==null) {
                                data.groups_topics[i].topics= [];
                            }
                            //console.log(data.groups_topics[i].id);
                            data.groups_topics[i].topics.push(topics[data.tags[j].topicId]);
                            data.groups_topics[i].topics[data.groups_topics[i].topics.length-1].isBelong= false;
                        }
                    }
                }
                //console.log(data)
                localStorage['ionic_data'] = JSON.stringify(data);
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
            },
            newTag: function (data) {
                return $http.post(DOMAIN+"newTag", data).then(function (response) {
                    return response.data;
                });
            }, 
            newFriendRequest: function (data) {
                return $http.post(DOMAIN+"newFriendRequest", data).then(function (response) {
                    return response.data;
                });
            }, 
            addUsersToGroup: function (data) {
                return $http.post(DOMAIN+"addUsersToGroup", data).then(function (response) {
                    return response.data;
                });
            }, 
            leaveGroup: function (data) {
                return $http.post(DOMAIN+"leaveGroup", data).then(function (response) {
                    return response.data;
                });
            }
        }
    })

    .factory('Noti', function (Topic) {
        function validate (dataIn) {
            var temp= localStorage['ionic_noti'];
            var data;
            if (temp== null) {
                data= [];
            } else {
                data= JSON.parse(localStorage['ionic_noti']);
            }
            for (var i in data) {
                if (data[i].groupId== dataIn.groupId && data[i].topicId== dataIn.topicId) {
                    data.splice(i, 1);
                    break;
                }
            }
            return data;
        };
        return {
            checkNoti: function (dataIn) {
                var temp= localStorage['ionic_noti'];
                if (temp== null) {
                    return 'On';
                } else {
                    var data= JSON.parse(temp);
                    if (dataIn.groupId == -1 && dataIn.topicId == -1) {
                        for (var i in data) {
                            if (data[i].topicId == -1 && data[i].groupId == -1) {
                                if (data[i].until== 'off') {
                                    return 'Off';
                                } else if ((new Date()).getTime() < data[i].until) {
                                    return 'Off';
                                } else {
                                    data.splice(i, 1);
                                    return 'On';
                                }
                            }
                        }
                    }
                    else {
                        for (var i in data) {
                            if (dataIn.groupId == -1 && 
                                Topic.getGroupOfTopic(dataIn.topicId) == data[i].groupId) {
                                return 'Off';
                            }
                            else if (data[i].groupId== dataIn.groupId && data[i].topicId== dataIn.topicId) {
                                if (data[i].until== 'off') {
                                    return 'Off';
                                } else if ((new Date()).getTime() < data[i].until) {
                                    return 'Off';
                                } else {
                                    data.splice(i, 1);
                                    return 'On';
                                }
                            }
                        }
                    }
                    return 'On';
                }
            },
            onNoti: function (dataIn) {
                localStorage['ionic_noti'] = JSON.stringify(validate(dataIn));
            },
            offNoti: function (dataIn) {
                var data= validate(dataIn);  
                data.push(dataIn);
                localStorage['ionic_noti'] = JSON.stringify(data);
            }
        };
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
        function getUserIdList (id) {
            var string= '+';
            var group_user= StorageData.getData().group_user;
            for (var i in group_user) {
                if (group_user[i].groupId== id) {
                    if (!string) {
                        string= group_user[i].userId;
                    }
                    else {
                        string+= (group_user[i].userId +'+');
                    }
                }
            }
            return string;
        };
        return {
            getUserForAddPeople: function(groupId) {
                var users= StorageData.getData().users;
                var gro_use= StorageData.getData().group_user;
                var temp= '+';
                var returnUsers= [];
                for (var i in gro_use) {
                    if (gro_use[i].groupId== groupId) {
                        temp+= (gro_use[i].userId +'+');
                    }
                }
                for (var i in users) {
                    var regexString= '\\+' +users[i].id +'\\+';
                    var regex= new RegExp(regexString, 'g');
                    if (temp.match(regex)==null) {
                        returnUsers.push(users[i]);
                    }
                }
                return returnUsers;
            },
            getUserNamesInGroup: function (id) {
                var list= getUserIdList(id);
                var users= StorageData.getData().users;
                var string= '';
                for (var i in users) {
                    var regexString= '\\+' +users[i].id +'\\+';
                    var regex= new RegExp(regexString, 'g');
                    if (list.match(regex)!= null) {
                        if (!string) {
                            string= users[i].firstName;
                        }
                        else {
                            string+= (', ' +users[i].firstName);
                        }
                    }
                }
                return string;
            },
            getUserInfo: function (id) {
                var users= StorageData.getData().users;
                for (var i in users) {
                    if (users[i].id== id) {
                        return users[i];
                    }
                }
            },
            getUsers: function () {
                return StorageData.getData().users;
            },
            setGroupUser: function (userList, groupId) {
                var data= StorageData.getData();
                var list= userList.split('+');
                var ele;
                for (var i in list) {
                    ele= {  id: data.group_user[data.group_user.length-1].id+1,
                            groupId: groupId,
                            userId: list[i],
                            isAdmin: (i==(list.length-1) ?1 :0)}
                    data.group_user.push(ele);
                }
            },
            getMembers: function (id) {
                var list= getUserIdList(id);
                var members= [];
                var users= StorageData.getData().users;
                for (var i in users) {
                    var regexString= '\\+' +users[i].id +'\\+';
                    var regex= new RegExp(regexString, 'g');
                    if (list.match(regex)!= null) {
                        members.push(users[i]);
                    }
                }
                return members;
            },
            getLastTimeActive: function (id) {
                var chats= StorageData.getData().topicchats;
                for (var i in chats) {
                    if (chats[i].userId == id) {
                        var now= new Date();
                        // chuyển giá trị dateTime trả về từ server thành GMT+7(local timezone) từ giá trị GMT+0
                        var messTime= new Date(chats[i].dateTime);
                        var returnTime= messTime.getHours() +":" 
                                +((messTime.getMinutes()<10) ?('0'+messTime.getMinutes()) :(messTime.getMinutes()));
                        if (messTime.getDate()!= now.getDate() ||
                            messTime.getMonth()!= now.getMonth() ||
                            messTime.getFullYear()!= now.getFullYear()) {
                            returnTime+= "  " +messTime.getDate() +"/" +(messTime.getMonth()+1);
                        }
                        return returnTime;
                    }
                }
            }
        }
    }])

    .factory('Group', ['StorageData', function (StorageData, $rootScope) {
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
        };
        function getGroupsIdOfUser (userId) {
            groupsIdOfUser= '+';
            var group_user= StorageData.getData().group_user;
            for (var i in group_user) {
                if (userId== group_user[i].userId) {
                    groupsIdOfUser+= (group_user[i].groupId +'+');
                }
            }
        }
        return {
            setGrGr: function (arg) {
                var data= StorageData.getData();
                var pos;
                if (data.group_group== null) {
                    pos= 0;
                    data.group_group= [];
                } else {
                    pos= data.group_group.length;
                }
                list= arg.groupList.split('+');
                for (var i in list) {
                    data.group_group.push({id:++pos, secondGroupId:list[i], firstGroupId: arg.group});
                }
                console.log(data);
                StorageData.saveData(data);
            },
            getGroupsForSendRequest: function (groupId) {
                var returnGroups= [];
                var groups= StorageData.getData().groups_topics;
                var gr_gr= StorageData.getData().group_group;
                var temp= '+';
                for (var i in gr_gr) {
                    if (gr_gr[i].firstGroupId== groupId) {
                        temp+= (gr_gr[i].secondGroupId +'+');
                    }
                    else if (gr_gr[i].secondGroupId== groupId) {
                        temp+= (gr_gr[i].firstGroupId +'+');
                    }
                }
                //console.log(temp +', ' +groupId);
                for (var i in groups) {
                    var regexString= '\\+' +groups[i].id +'\\+';
                    var regex= new RegExp(regexString, 'g');
                    if (temp.match(regex)== null && groups[i].id!= groupId) {
                        returnGroups.push(groups[i]);
                    }
                }
                return returnGroups;
            },
            getGroupsForTag: function (topicId) {
                var returnGroups= [];
                var check= true;
                var groups= StorageData.getData().groups_topics;
                for (var i in groups) {
                    check= true;
                    for (var j in groups[i].topics) {
                        if (groups[i].topics[j].id== topicId) {
                            check= false;
                            break;
                        }
                    }
                    if (check) {
                        returnGroups.push(groups[i]);
                    }
                }
                return returnGroups;
            },
            getGroupsTaged: function (topicId) {
                var returnGroups= [];
                var groups= StorageData.getData().groups_topics;
                var tags= StorageData.getData().tags;
                var temp= "+";
                for (var i in tags) {
                    if (tags[i].topicId== topicId) {
                        temp+= (tags[i].groupId +"+");
                    }
                }
                for (var i in groups) {
                    var regexString= "\\+" +groups[i].id +"\\+";
                    var regex= new RegExp (regexString, "g");
                    if (temp.match(regex)!= null) {
                        returnGroups.push(groups[i]);
                    }
                }
                return returnGroups;
            },
            setTag: function (arg) {
                //console.log(arg);
                var data= StorageData.getData();
                var pos;
                if (data.tags== null) {
                    pos= 0;
                    data.tags= [];
                } else {
                    pos= data.tags.length;
                }
                list= arg.groupList.split('+');
                for (var i in list) {
                    data.tags.push({id:++pos, groupId:list[i], topicId: arg.topic});
                }
                StorageData.saveData(data);
                StorageData.rewriteData();
            },
            setGroup: function (id, name) {
                var data= StorageData.getData();
                data.groups_topics.push({id: id, name: name});
                StorageData.saveData(data);
            },
            userIsBelong: function (groupId, userId) {
                if (groupsIdOfUser.length<3) {
                    getGroupsIdOfUser(userId);
                }
                var regexString= ('\\+' +groupId +'\\+');
                var regex= new RegExp(regexString, 'g');
                if (groupsIdOfUser.match(regex)!=null) {
                    return 'true';
                }
                return 'false';
            },
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
                getGroupsIdOfUser(userId);
                return returnGroups(groupsIdOfUser);
            },
            getGroupsOfFriend: function (userId) {
                var id= '+';
                var group_user= StorageData.getData().group_user;
                for (var i in group_user) {
                    if (userId== group_user[i].userId) {
                        id+= (group_user[i].groupId +'+');
                    }
                }
                return returnGroups(id);
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
            },
            getAllGroups: function () {
                return StorageData.getData().groups_topics;
            },
            addUsers: function (dataIn) {
                var data= StorageData.getData();
                var userList= dataIn.userList.split('+');
                for (var i in userList) {
                    var temp= {groupId: dataIn.group, userId: userList[i]};
                    data.group_user.push(temp);
                }
                // console.log (data.group_user);
                StorageData.saveData(data);
            },
            removeUsers: function (dataIn) {
                var data= StorageData.getData();
                // var userList= dataIn.userList.split('+');
                for (var i in data.group_user) {
                    if (data.group_user[i].userId== dataIn.userId && 
                        data.group_user[i].groupId== dataIn.groupId) {
                        data.group_user.splice(i, 1);
                    }
                }
                // console.log (data.group_user);
                StorageData.saveData(data);
            }
        }
    }])

    .factory('Topic', ['User', 'Chat', 'StorageData', function (User, Chat, StorageData) {
        var topicsIdOfUser= '+';
        var bookmarkTopicsIdOfUser= '+';
        var bookmarkTopics= [];
        var recentTopics= [];
        var topics= [];
        function setTopics () {
            topics= [];
            var groups_topics= StorageData.getData().groups_topics;
            for (var i in groups_topics) {
                for (var j in groups_topics[i].topics) {
                    // đưa những tất cả topic vào mảng
                    topics.push(groups_topics[i].topics[j]);
                }
            }
        };
        return {
            changePrivacy: function (dataIn) {
                var data = StorageData.getData();
                for (var i in data.groups_topics) {
                    for (var j in data.groups_topics[i].topics) {
                        if (data.groups_topics[i].topics[j].id == dataIn.topicId) {
                            data.groups_topics[i].topics[j].type = dataIn.type;
                            StorageData.saveData(data);
                            console.log(data);
                            return;
                        }
                    }
                }
            },
            getGroupOfTopic: function (topicId) {
                var groups= StorageData.getData().groups_topics;
                for (var i in groups) {
                    for (var j in groups[i].topics) {
                        if (groups[i].topics[j].id== topicId && groups[i].topics[j].isBelong== null)
                            return groups[i].id;
                    }
                }
            },
            addBookmark: function (userId, topicId) {
                var data= StorageData.getData();
                var pos= (data.bookmark.length>0 ?data.bookmark.length :0);
                data.bookmark[pos]= {userId: userId, topicId: topicId,
                    id: (pos>0 ?data.bookmark[pos-1].id :1)};
                StorageData.saveData(data);
            },
            removeBookmark: function (userId, topicId) {
                var data= StorageData.getData();
                for (var i in data.bookmark) {
                    if (data.bookmark[i].userId== userId && data.bookmark[i].topicId== topicId) {
                        data.bookmark.splice(i, 1);
                    }
                }
                StorageData.saveData(data);
            },
            isBookmark: function (id) {
                var regexString= ('\\+' +id +'\\+');
                var regex= new RegExp (regexString);
                if (bookmarkTopicsIdOfUser.match(regex)!= null) {
                    return true;
                }
                return false;
            },
            isRelation: function (id) {
                var regexString= ('\\+' +id +'\\+');
                var regex= new RegExp (regexString);
                if (topicsIdOfUser.match(regex)!= null || bookmarkTopicsIdOfUser.match(regex)!= null) {
                    return true;
                }
                return false;
            },
            getRecentTopcis: function (userId) {
                var groups_topics= StorageData.getData().groups_topics;
                var regexString= '';
                var regex;
                var groupsIdOfUser= '+';
                
                bookmarkTopics= [];
                recentTopics= [];
                topics= [];
                topicsIdOfUser= '+';
                bookmarkTopicsIdOfUser= '+';
                
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
                
                for (var i in groups_topics) {
                    for (var j in groups_topics[i].topics) {
                        // đưa những tất cả topic vào mảng
                        //console.log(groups_topics[i].topics[j].isBelong);
                        if (groups_topics[i].topics[j].isBelong== null) {
                            topics.push(groups_topics[i].topics[j]);
                        }
                        var regexString= ('\\+' +groups_topics[i].id +'\\+');
                        var regex= new RegExp (regexString);
                        //console.log(groups_topics[i].topics[j]);
                        var regexString2= ('\\+' +groups_topics[i].topics[j].id +'\\+');
                        var regex2= new RegExp (regexString2);
                        if (groupsIdOfUser.match(regex)!= null && topicsIdOfUser.match(regex2)==null) {
                            topicsIdOfUser+= (groups_topics[i].topics[j].id +'+');
                        }
                        // đưa những topic được bookmark vào mảng
                        if (bookmarkTopicsIdOfUser.match(regex2)!= null) {
                            bookmarkTopics.push(groups_topics[i].topics[j]);
                        }
                    }
                }

                //console.log(topicsIdOfUser);
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
                //console.log(topics);
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
                setTopics();
                return topics;
            },
            getTopicById: function (id) {
                if (topics.length<1) {
                    setTopics();
                }
                for (var i in topics) {
                    if (topics[i].id== id) {
                        return topics[i];
                    }
                }
            },
            newTopic: function (topic) {
                var data= StorageData.getData();
                for (var i in data.groups_topics) {
                    if (data.groups_topics[i].id== topic.groupId) {
                        if (data.groups_topics[i].topics == null) {
                            data.groups_topics[i].topics = [];
                        }
                        data.groups_topics[i].topics.push(topic);
                        StorageData.saveData(data);
                        return;
                    }
                }
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
                    return "Không có tin nhắn gần đây.";
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
                    return "Không có tin nhắn gần đây.";
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
                    returnTime= messTime.getDate() +"/" +(messTime.getMonth()+1);
                }
                return returnTime;
            },
            add: function (chat) {
                var data= StorageData.getData();
                data.topicchats.push(chat);
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
