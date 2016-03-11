//var DOMAIN="http://192.168.0.103:8028/";
var DOMAIN="http://localhost:8028/";
//var DOMAIN="http://:8028/";

// Users
angular.module('starter.services', ['ionic', 'ngSanitize','btford.socket-io'])
    .factory('StorageData', function () {
        var recent;
        var peopleInGroups;
        var recentRooms;
        var allGroups;
        var allRooms;
        var allChats;

        return {
            getRecent: function () {
                return recent;
            },
            setRecent: function(value) {
                recent = value;
            },
            getPeopleInAllGroups: function () {
                return peopleInGroups;
            },
            setPeopleInAllGroups: function(value) {
                peopleInGroups = value;
            },
            getRecentRooms: function () {
                return recentRooms;
            },
            setRecentRooms: function(value) {
                recentRooms = value;
            },
            getAllGroups: function() {
                return allGroups;
            },
            setAllGroups: function(value) {
                allGroups = value;
            },
            getAllRooms: function () {
                return allRooms;
            },
            setAllRooms: function(value) {
                allRooms = value;
            },
            getAllChats: function () {
                return allChats;
            },
            setAllChats: function(value) {
                allChats = value;
            },
            addChat: function(chatId, text, roomId, userId, time, userAva, userNam) {
                var id
                if (allChats.length< 1) {
                    id= 1;
                }
                else {
                    //0 là giá trị tương ứng với tin nhắn được gửi từ máy, lưu trực tiếp vào các dòng chat hiện tại
                    id= ((chatId<1) ?((allChats[allChats.length-1].chatId)+1) :chatId)
                }
                var ele= {
                    chatId: id,
                    roomId: roomId,
                    userId: userId,
                    chatText: text,
                    dateTime: (time=="now" ?new Date() :time),
                    userAvata: userAva, 
                    userName: userNam
                }
                allChats.push(ele);
            },
            resortRecent: function (rId) {
                var newRecent= [];
                var ele= {roomId: rId}
                newRecent.push(ele);
                for (var i in recent) {
                    if (newRecent.length<5 && rId!= recent[i].roomId) {
                        newRecent.push(recent[i]);
                    }
                }
                recent= newRecent;
            },
        };
    })

    .factory('GetData', function ($http) {
        return {
            getAll: function (userId) {
                var data= {'id': userId}
                return $http.post(DOMAIN+"groupsAndRooms", data).then(function (response) {
                    return response.data;
                });
            },
            getAllChats: function (userId) {
                var data= {'id': userId}
                return $http.post(DOMAIN+"chats", data).then(function (response) {
                    return response.data;
                });
            },
            getRecent: function (userId) {
                var data= {'id': userId}
                return $http.post(DOMAIN+"recent", data).then(function (response) {
                    return response.data;
                });
            },
            getPeopleInAllGroups: function (userId) {  
                var data= {'id': userId}
                return $http.post(DOMAIN+"peopleInAllGroups", data).then(function (response) {
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

    .factory('Socket',function(socketFactory){
        //Create socket and connect to localhost        
        var myIoSocket = io.connect(DOMAIN);
        mySocket = socketFactory({
            ioSocket: myIoSocket
        });

        return mySocket;
    })

    .factory('User', ['StorageData', function (StorageData) {
        var allPeople= [];
        return {
            getAllPeople: function () {
                if (allPeople.length < 1) {
                    var all= StorageData.getPeopleInAllGroups();
                    var temp;
                    var pos;
                    for (var i in all) {
                        temp= all[i].userId;
                        pos= i;
                        for (var j= i; j< all.length; j++) {
                            if (temp> all[j].userId) {
                                pos= j;
                                temp= all[j].userId;
                            }
                        }
                        temp= all[i];
                        all[i]= all[pos];
                        all[pos]= temp;
                        if (i==0) {
                            allPeople.push(all[i]);
                        }
                        else if (all[i].userId!= all[i-1].userId) {
                            allPeople.push(all[i]);
                        }
                    }
                }
                return allPeople;
            }
        };
    }])

    // Rooms
    .factory('Room', ['User', 'Chat', 'StorageData', function (User, Chat) {
        var rooms = [
            {
                id: "room_a",
                roomType: "group",
                thumbnail: "img/thumbnail01.jpg",
                title: "I Love Coffee",
                members: "Felix, Eric, Diamond",
                activeTime: "Active today",
                userList: ["213", "1", "2"]
            }
        ];
        return {
            getRecent: function () {
                //return StorageData
            },

            // for tab-groups
            getRooms: function (userId, rowItemNum) {
                var groupList = [];
                var rowList = [];
                for (var i = 0; i < rooms.length; i++) {
                    var isInRoom = false;
                    if (!isInRoom && rooms[i].userList.length > 2) {
                        for (var j = 0; j < rooms[i].userList.length; j++) {
                            if (rooms[i].userList[j] === userId) {
                                isInRoom = true;
                            }
                        }
                    }
                    if (isInRoom) {
                        rowList.push(rooms[i]);
                    }
                    if (rowList.length == rowItemNum || i + 1 == rooms.length) {
                        groupList.push(rowList);
                        rowList = [];
                    }
                }
                return groupList;
            },

            // for tab-activities
            userActivities: function (userId) {
                //window.alert(data[0].description);
                var roomList = [];
                for (var i = 0; i < rooms.length; i++) {
                    var isInRoom = false;
                    if (!isInRoom) {
                        for (var j = 0; j < rooms[i].userList.length; j++) {
                            if (rooms[i].userList[j] === userId) {
                                isInRoom = true;
                            }
                        }
                    }
                    if (isInRoom) {
                        var roomChats = Chat.getByRoom(rooms[i].id);

                        if(roomChats.length > 0){
                            rooms[i].latest_chat = roomChats[roomChats.length - 1].chatText;
                            roomList.push(rooms[i]);
                        }
                    }
                }
                return roomList;
            },

            get: function (roomId) {
                for (var i = 0; i < rooms.length; i++) {
                    if (rooms[i].id === roomId) {
                        rooms[i].user = [];
                        for (var j = 0; j < rooms[i].userList.length; j++) {
                            rooms[i].user.push(User.get(rooms[i].userList[j]));
                        }
                        return rooms[i];
                    }
                }
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
            },

            // for tab-friends
            getByUserId: function (userId) {
                var hasRoom = false;
                for (var i = 0; i < rooms.length; i++) {
                    if(rooms[i].roomType != "group" && !hasRoom){
                        for(var j=0; j<rooms[i].userList.length; j++){
                            if(rooms[i].userList[j] === userId){
                                hasRoom = true;
                                return rooms[i];
                            }
                        }
                    }
                }
                if(!hasRoom){
                    var user = User.get(userId);
                    var newRoom = {
                        id: "new" + "/" + user.id
                    };
                    return newRoom;
                }
                return null;

            }
        };
    }])

    // Chats
    .factory('Chat', ['User', function (User) {
        var chats = [];

        return {
            all: function () {                
                return chats;
            },
            add: function (chatText, roomId, userId) {
                var chat = {
                    id: chats.length + 1,
                    userId: userId,
                    chatText: chatText,
                    roomId: roomId,
                    dateTime: "0000-00-00 00:00:00"
                };
                chats.push(chat);
                //console.log(chats);
            },
            get: function (chatId) {
                for (var i = 0; i < chats.length; i++) {
                    if (chats[i].id === chatId) {
                        chats[i].user = User.get(chats[i].userId);
                        return chats[i];
                    }
                }
                return null;
            },
            getByRoom: function (roomId) {
                var chatList = [];
                for (var i = 0; i < chats.length; i++) {
                    if (chats[i].roomId === roomId) {
                        //chats[i].user = User.get(chats[i].userId);
                        chatList.push(chats[i]);
                    }
                }
                return chatList;
            }
        };
    }]);

   