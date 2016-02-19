var express = require('express');
var app = express();
var mysql = require('mysql');
var mysql_config = require('./mysql_config.js');
var func = require('./main.js');

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8028;

var mysqlConnection = mysql.createConnection(mysql_config.mySQLConfiguration());

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/', function(req, res){

    var sql = "SELECT * FROM groups INNER JOIN group_room ON groups.id=group_room.groupId INNER JOIN rooms ON rooms.id=group_room.roomId INNER JOIN group_user ON groups.id= group_user.groupId INNER JOIN users ON group_user.userId= users.id INNER JOIN chats ON rooms.id= chats.roomId";
    var nestingOptions = [
        { tableName: 'groups', pkey: 'id'},        
        { tableName: 'group_room', pkey: 'id', fkeys: [{table: 'groups', col: 'groupId'}, {table:'rooms', col: 'roomId'}]},
        { tableName: 'rooms', pkey: 'id', },
        { tableName: 'group_user', pkey: 'id', fkeys: [{table: 'groups', col: 'groupId'}, {table: 'users', col: 'userId'}]},
        { tableName: 'users', pkey: 'id'},
        { tableName: 'chats', pkey: 'id', fkeys: [{table: 'users', col: 'userId'}, {table: 'rooms', col: 'roomId'}]}
    ]; 
    mysqlConnection.query({sql: sql, nestTables: true}, function (err, rows) {
        // error handling
        if (err){
            console.log('Internal error: ', err);
            res.send("Mysql query execution error!");
        }

        else {
            var nestedRows = func.convertToNested(rows, nestingOptions);
            // res.send(JSON.stringify(nestedRows));
            res.send(nestedRows);
        }

    });

});



// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;


io.on('connection', function (socket) {
  var addedUser = false;
  var roomId;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
	console.log(roomId);
    socket.broadcast.to(roomId).emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username, id) {
	  roomId= id;
	  //console.log(roomId);
    if (addedUser) return;
     socket.join(roomId);
    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.to(roomId).emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.to(roomId).emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.to(roomId).emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.to(roomId).emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});

//app.listen('8028');
//console.log('Server is listening on port 8028');
exports = module.exports = app;