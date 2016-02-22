var DOMAIN="http://127.0.0.1:8028/";

// Users
angular.module('starter.services', ['ionic', 'ngSanitize','btford.socket-io'])
    .factory('Data', function ($http) {
        var data;
        return {
            getAll: function () {  
                console.log(DOMAIN)
                return $http.get(DOMAIN).then(function (response) {
                    //console.log(response.data);
                    data = response.data;
                    //users= data[0].group_user[0].users;

                    //window.alert(data[0].name);
                    return response.data;
                });                      
                
            }
        }
    })

    .factory('Socket',function(socketFactory){
    //Create socket and connect to localhost
        console.log(DOMAIN)
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
                ////window.alert("?234234??");
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
                //window.alert("?????");
                return rooms;
            },

            // for tab-groups
            allGroups: function (userId, rowItemNum) {
                //window.alert("123");
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
                //window.alert("22");
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
                ////window.alert("22");
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
                ////window.alert("?");
                for (var i = 0; i < chats.length; i++) {
                    if (chats[i].id === chatId) {
                        chats[i].user = User.get(chats[i].userId);
                        return chats[i];
                    }
                }
                return null;
            },
            getByRoom: function (roomId) {
                ////window.alert("?");
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

   