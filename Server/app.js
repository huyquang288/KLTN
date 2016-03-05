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

app.post('/login', function (req, res){
	//console.log("login request")
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

app.post('/all', function(req, res){
	var userId= req.body.id
	var sql = "SELECT * FROM groups JOIN group_room ON groups.id=group_room.groupId JOIN rooms ON rooms.id= group_room.roomId WHERE groups.id IN (SELECT DISTINCT groupId FROM group_user WHERE userId= " +userId +") ";
	var nestingOptions = [
		{ tableName: 'groups', pkey: 'id'},        
		{ tableName: 'group_room', pkey: 'id', fkeys: [{table: 'groups', col: 'groupId'}, {table:'rooms', col: 'roomId'}]},
		{ tableName: 'rooms', pkey: 'id', }
	];
	mysqlConnection.query({sql: sql, nestTables: true}, function (err, rows) {
    // error handling
		if (err){
			console.log('Internal error: ', err);
			res.send("Mysql query execution error!");
		}
		else {
			var nestedRows = func.convertToNested(rows, nestingOptions);
			res.send(nestedRows);
		}
	});
});

app.post('/chats', function(req, res){
	var userId= req.body.id
	var sql = "select * from chats where roomId in (select distinct roomId from group_room where groupId in (select groupId from group_user where userId = " +userId +"));";
	mysqlConnection.query({sql: sql, nestTables: false}, function (err, rows) {
    // error handling
		if (err){
			console.log('Internal error: ', err);
			res.send("Mysql query execution error!");
		}
		else {
			var nestedRows = func.convertToNested(rows);
			res.send(nestedRows);
		}
	});
});

app.post('/recent', function(req, res){
	var userId= req.body.id
	var sql= "select * from (SELECT id, roomId FROM chats where roomId in (select distinct roomId from group_room where groupId in (select distinct groupId from group_user where userId=" +userId +")) order by id desc) as t1 group by roomId order by id desc limit 5"
	
	mysqlConnection.query({sql: sql, nestTables: false}, function (err, rows) {
	// error handling
	if (err){
		console.log('Internal error: ', err);
		res.send("Mysql query execution error!");
	}
	else {
		var nestedRows = func.convertToNested(rows);
		res.send(nestedRows);
	}
	});
});

app.post('/peopleInAllGroups', function(req, res){
	var userId= req.body.id
	var sql = "select * from users join (select group_user.groupId, group_user.userId from group_user join (select distinct groupId from group_user where userId=" +userId +") as t1 on t1.groupId=group_user.groupId) as t2 on t2.userId=users.id";  
	mysqlConnection.query({sql: sql, nestTables: false}, function (err, rows) {
    // error handling
		if (err){
			console.log('Internal error: ', err);
			res.send("Mysql query execution error!");
		}
		else {
			var nestedRows = func.convertToNested(rows);
			res.send(nestedRows);
		}
	});
});



// Routing
app.use(express.static(__dirname + '/'));
// Chatroom
io.on('connection', function (socket) {
	//var addedUser = false;
	//var roomId;
  
	// when the client emits 'add user', this listens and executes
	socket.on('user join to room', function (roomId, userId) {
		//if (addedUser) return;
		socket.join(roomId);
		//console.log('added to room');
		// we store the username in the socket session for this client
		socket.userId = userId;    
		//addedUser = true;
		socket.broadcast.to(roomId).emit('user joined', {
			userId: socket.userId,
		});
	});
  
	// when the client emits 'new message', this listens and executes
	// we tell the client to execute 'new message'  
	socket.on('client new message', function (data) {
		// query to save mess into db
		//var que= "INSERT INTO chats SET ?", data;
		socket.text= data.chatText;
		socket.userId= data.userId;
		socket.roomId= data.roomId;
		socket.userAvata= data.userAvata;
		// write to db
		console.log(data.userAvata);
		mysqlConnection.query("INSERT INTO chats SET ?", data, function(err, rows){
			if (err) {
				console.log('Internal error: ', err);
			}
			else {
				var que= "select * from chats where id in (select max(id) from chats)";
				// write to db
				mysqlConnection.query({sql: que, nestTables: false}, function(err, rows){
					if (err) {
						console.log('Internal error: ', err);
					}
					else {
						//console.log(socket.text);
						var nestedRows = func.convertToNested(rows);
						socket.chatId= nestedRows[0].id;
						socket.dateTime= nestedRows[0].dateTime
						//console.log(nestedRows[0].id);
						socket.broadcast.to(socket.roomId).emit('server new room message', {
							userId: socket.userId,
							chatText: socket.text,
							chatId: socket.chatId,
							dateTime: socket.dateTime,
							userAvata: socket.userAvata
						});
						socket.broadcast.emit('server new all message', {
							userId: socket.userId,
							chatText: socket.text,
							chatId: socket.chatId,
							roomId: socket.roomId,
							dateTime: socket.dateTime,
							userAvata: socket.userAvata
						});
						//console.log("sent");
					}
				})
			}
		})
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
		// echo globally that this client has left
		// đoạn này cũng có thể dùng để thông báo ai đã off.
		//console.log("user left");
		socket.broadcast.to(socket.roomId).emit('user left', {
			username: socket.userId,
		});
	});
});

exports = module.exports = app;