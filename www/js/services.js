//var DOMAIN="http://192.168.0.103:8028/";
var DOMAIN="http://localhost:8028/";
//var DOMAIN="http://:8028/";

// Users
angular.module('starter.services', ['ionic', 'ngSanitize','btford.socket-io'])
    .factory('Data', function ($http) {
        return {
            getAll: function () {  
                return $http.get(DOMAIN+"all").then(function (response) {
                    return response.data;
                });
            },
            getRecent: function () {  
                return $http.get(DOMAIN+"recent").then(function (response) {
                    return response.data;
                });
            }
        }
    })

    .factory('Login', function ($http) {
        return {
            sendData: function (ema, pas) {  
                //console.log(pas);
                var data= {'email':ema, 'pass':pas};
                return $http.post(DOMAIN, data).then(function (response) {
                    //console.log("haha");
                    return response.data;
                });
            }
        }
    })
//, {headers: {'Content-Type': 'application/x-www-form-urlencoded'} }

    .factory('Socket',function(socketFactory){
    //Create socket and connect to localhost        
        var myIoSocket = io.connect(DOMAIN);

        mySocket = socketFactory({
            ioSocket: myIoSocket
        });

        return mySocket;
    })


    .factory('User', function () {
        var users = [
            {
                id: "1",
                friendType: "Messenger",
                name: "felix",
                face: 'img/user01.jpg',
                email: 'hi@weburner.com',
                activeTime: "Active today"
            },
            {
                id: "213",
                name: "Diamond",
                friendType: "Messenger",
                face: 'img/user04.jpg',
                email: 'hi@weburner.com',
                activeTime: "Active 3m ago"
            }
        ];

        return {
            all: function () {                        
                return users;
            },
            myFriends: function (myId) {
                var friends = [];
                for (var i = 0; i < users.length; i++) {
                    if (users[i].id != myId) {
                        friends.push( users[i]);
                    }
                }
                return friends;
            },
            get: function (userId) {
                for (var i = 0; i < users.length; i++) {
                    if (users[i].id === userId) {
                        return users[i];
                    }
                }
                return null;
            }
        };
    })

// Rooms
    .factory('Room', ['User', 'Chat', function (User, Chat) {
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
            all: function () {
                return rooms;
            },

            // for tab-groups
            allGroups: function (userId, rowItemNum) {
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
            set: function (allMess) {
                for (var i in allMess) {
                    //chats= allMess;
                    var chat = {
                        id: allMess[i].id,
                        userId: allMess[i].userId.toString(),
                        chatText: allMess[i].chatText,
                        roomId: allMess[i].roomId.toString(),
                        dateTime: "0000-00-00 00:00:00"
                    };
                    chats.push(chat);
                }
                
            },
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
                console.log(chats);
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

   