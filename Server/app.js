var express = require('express');
var app = express();
var mysql = require('mysql');
var mysql_config = require('./mysql_config.js');
var func = require('./main.js');

var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 8028;

var mysqlConnection = mysql.createConnection(mysql_config.mySQLConfiguration());

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

var userJustLoginId=1;

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

app.post('/', function (req, res){
  var data= req.body;  
  var sql= "select userId from account_user where accountId in (select id from accounts where email='" +data.email +"' and password='" +data.pass +"')";
  var nestingOptions = [
    { tableName: 'account_user', pkey: 'userId'}
  ];
  
  mysqlConnection.query({sql: sql, nestTables: true}, function (err, rows) {
	// error handling
    if (err){
      console.log('Internal error: ', err);
      res.send("404 Not Found");
    }
    else {
      var nestedRows = func.convertToNested(rows, nestingOptions);
	  if (nestedRows[0]!="" && nestedRows[0]!=undefined) {
		res.send(nestedRows);
	  }
	  else {
		res.send("Wrong");
	  }
    }
  });
	
});

app.get('/all', function(req, res){
  var sql = "SELECT * FROM groups JOIN group_room ON groups.id=group_room.groupId JOIN rooms ON rooms.id= group_room.roomId JOIN chats ON chats.roomId= rooms.id WHERE groups.id IN (SELECT DISTINCT groupId FROM group_user WHERE userId= " +userJustLoginId +") ";
  var nestingOptions = [
    { tableName: 'groups', pkey: 'id'},        
    { tableName: 'group_room', pkey: 'id', fkeys: [{table: 'groups', col: 'groupId'}, {table:'rooms', col: 'roomId'}]},
    { tableName: 'rooms', pkey: 'id', },
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
	  //console.log(nestedRows);
      res.send(nestedRows);
    }
  });
});

app.get('/recent', function(req, res){
  var sql= "SELECT distinct roomId FROM chats where roomId in (select distinct roomId from group_room where groupId in (select distinct groupId from group_user where userId=" +userJustLoginId +")) order by dateTime desc limit 5"
  var nestingOptions = [
    { tableName: 'chats', pkey: 'roomId'}
  ];
  mysqlConnection.query({sql: sql, nestTables: true}, function (err, rows) {
    // error handling
    if (err){
      console.log('Internal error: ', err);
      res.send("Mysql query execution error!");
    }
    else {
      var nestedRows = func.convertToNested(rows, nestingOptions);
	  //console.log(nestedRows);
      res.send(nestedRows);
    }
  });
});

app.get('/peopleInGroup', function(req, res){
  var sql = "select * from users join (select group_user.groupId, group_user.userId from group_user join (select distinct groupId from group_user where userId=" +userJustLoginId +") as t1 on t1.groupId=group_user.groupId) as t2 on t2.userId=users.id";  
  mysqlConnection.query({sql: sql, nestTables: false}, function (err, rows) {
    // error handling
    if (err){
      console.log('Internal error: ', err);
      res.send("Mysql query execution error!");
    }
    else {
      var nestedRows = func.convertToNested(rows);
	  //console.log(nestedRows);
      res.send(nestedRows);
    }
  });
});



// Routing
app.use(express.static(__dirname + '/'));
// Chatroom
io.on('connection', function (socket) {
  var addedUser = false;
  var roomId;

  // when the client emits 'new message', this listens and executes
  // we tell the client to execute 'new message'  
  socket.on('new message', function (data) {
  // query to save mess into db
  	var que= "INSERT INTO chats (userId, chatText, roomId) VALUES (2, '" +data +"', " +roomId +")";
    // write to db
  	mysqlConnection.query(que, function(err, rows){
  		if (err) {
  			console.log('Internal error: ', err);
  		}
  		else {
  			socket.broadcast.to(roomId).emit('new message', {
  				username: socket.username,
  				message: data
  			});
  		}
  	})

  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username, id) {	  
	  roomId= id;
    if (addedUser) return;
    socket.join(roomId);
    // we store the username in the socket session for this client
    socket.username = username;    
    addedUser = true;
    socket.emit('login', {
      //đoạn này có thể dùng để thông báo ai vừa online
    });
    // echo globally (all clients) that a person has connected
    // hoặc đoạn dưới này có thể dùng để thông báo ai vừa online
    socket.broadcast.to(roomId).emit('user joined', {
      username: socket.username,
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
      // echo globally that this client has left
      // đoạn này cũng có thể dùng để thông báo ai đã off.
      socket.broadcast.to(roomId).emit('user left', {
        username: socket.username,
      });
    }
  });
});

exports = module.exports = app;