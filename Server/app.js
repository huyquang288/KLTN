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
	var data= req.body;  
	var sql= "select userId from account_user where accountId in (select id from accounts where email='" +data.email +"')";
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
	var userId= req.body.id;
	var groups_topics, group_group, group_user, topicchats, users, bookmark, tags;
	var sql = "SELECT * FROM groups LEFT JOIN topics ON groups.id=topics.groupId";
	var nestingOptions = [
		{ tableName: 'groups', pkey: 'id'},
		{ tableName: 'topics', pkey: 'id', fkeys: [{table: 'groups', col: 'groupId'}]}
	];
	mysqlConnection.query({sql: sql, nestTables: true}, function (err, rows) {
    // error handling
		if (err){
			console.log('Internal error: ', err);
			res.send("Mysql query execution error!");
		}
		else {
			groups_topics = func.convertToNested(rows, nestingOptions);
			sql = "SELECT * FROM topicchats";
			mysqlConnection.query(sql, function (err, rows) {
			// error handling
				if (err){
					console.log('Internal error: ', err);
					res.send("Mysql query execution error!");
				}
				else {
					topicchats = func.convertToNested(rows);
					sql = "SELECT * FROM users";
					mysqlConnection.query(sql, function (err, rows) {
					// error handling
						if (err){
							console.log('Internal error: ', err);
							res.send("Mysql query execution error!");
						}
						else {
							users = func.convertToNested(rows);
							sql = "SELECT * FROM group_group";
							mysqlConnection.query(sql, function (err, rows) {
							// error handling
								if (err){
									console.log('Internal error: ', err);
									res.send("Mysql query execution error!");
								}
								else {
									group_group = func.convertToNested(rows);
									sql = "SELECT * FROM group_user";
									mysqlConnection.query(sql, function (err, rows) {
									// error handling
										if (err){
											console.log('Internal error: ', err);
											res.send("Mysql query execution error!");
										}
										else {
											group_user = func.convertToNested(rows);
											sql = "SELECT * FROM bookmark WHERE userId= " +userId +";";
											mysqlConnection.query(sql, function (err, rows) {
											// error handling
												if (err){
													console.log('Internal error: ', err);
													res.send("Mysql query execution error!");
												}
												else {
													bookmark = func.convertToNested(rows);
													sql = "SELECT * FROM tags";
													mysqlConnection.query(sql, function (err, rows) {
													// error handling
														if (err){
															console.log('Internal error: ', err);
															res.send("Mysql query execution error!");
														}
														else {
															tags = func.convertToNested(rows);
															var result= {
																groups_topics: groups_topics,
																group_group: group_group,
																group_user: group_user,
																bookmark: bookmark,
																topicchats: topicchats,
																users: users,
																tags: tags
															};
															//console.log (result);
															res.send(result);
														}
													});
												}
											});
										}
									});
								}
							});
						}
					});
				}
			});
		}
	});
});


app.post('/newGroup', function(req, res){
	var groupName= req.body.name
	var groupId;
	var userList= req.body.userList.split("+");
	var userString= "";
	var sql = "INSERT INTO groups (name) values ('" +groupName +"')";
	mysqlConnection.query(sql, function (err, rows) {
    // error handling
		if (err){
			console.log('Internal error: ', err);
			res.send("Mysql query execution error!");
		}
		else {
			var nestedRows = func.convertToNested(rows);
			groupId= nestedRows.insertId;
			var isAd= 0;
			var end= ", "
			for (var i in userList) {
				if (i== (userList.length-1)) {
					isAd= 1;
					end= ";";
				}
				userString+= "(" +groupId +", " +userList[i] +", " +isAd +")" +end;
			}
			var sql= "INSERT INTO group_user (groupId, userId, isAdmin) VALUES " +userString;
			mysqlConnection.query(sql, function (err, rows) {
			// error handling
				if (err){
					console.log('Internal error: ', err);
					res.send("Mysql query execution error!");
				}
				else {
					res.send(groupId.toString());
				}
			});
		}
	});
});

app.post('/newTag', function(req, res){
	var groupList= req.body.groupList.toString().split("+");
	var groupString= "";
	var end= ", "
	for (var i in groupList) {
		if (i== (groupList.length-1)) {
			end= ";";
		}
		groupString+= "(" +req.body.topic +", " +groupList[i] +")" +end;
	}
	var sql= "INSERT INTO tags (topicId, groupId) VALUES " +groupString;
	mysqlConnection.query(sql, function (err, rows) {
	// error handling
		if (err){
			console.log('Internal error tag column: ', err);
			res.send("Mysql query execution error!");
		}
		else {
			res.send('Done');
		}
	});
		
});

app.post('/newFriendRequest', function(req, res){
	var groupList= req.body.groupList.toString().split("+");
	var groupString= "";
	var end= ", "
	for (var i in groupList) {
		if (i== (groupList.length-1)) {
			end= ";";
		}
		groupString+= "(" +req.body.group +", " +groupList[i] +")" +end;
	}
	var sql= "INSERT INTO group_group (firstGroupId, secondGroupId) VALUES " +groupString;
	mysqlConnection.query(sql, function (err, rows) {
	// error handling
		if (err){
			console.log('Internal error tag column: ', err);
			res.send("Mysql query execution error!");
		}
		else {
			res.send('Done');
		}
	});
		
});

app.post('/newTopic', function(req, res){
	mysqlConnection.query("INSERT INTO topics SET ?", req.body, function (err, rows) {
    // error handling
		if (err){
			console.log('Insert to topics error: ', err);
			res.send("Mysql query execution error!");
		}
		else {
			var nestedRows = func.convertToNested(rows);
			res.send(nestedRows.insertId.toString());
		}
	});
});


// Routing
app.use(express.static(__dirname + '/'));
// Chattopic
io.on('connection', function (socket) {
  
	// when the client emits 'add user', this listens and executes
	socket.on('user join to topic', function (topicId, userId) {
		socket.join(topicId);
		//console.log('added to topic');
		// we store the username in the socket session for this client
		socket.userId = userId;
		socket.broadcast.to(topicId).emit('user joined', {
			userId: socket.userId,
		});
	});
	
	socket.on('new group', function (data) {
		socket.broadcast.emit('added to new group', data);
	});
	
	socket.on('new topic', function (data) {
		socket.broadcast.emit('created new topic', data);
	});
	
	socket.on('new tag', function (data) {
		socket.broadcast.emit('created new tag', data);
	});
	
	socket.on('new group friend request', function (data) {
		socket.broadcast.emit('created new friend request', data);
	});
	
	socket.on('bookmark', function (data) {
		var sql;
		if (data.state== 'Bookmark') {
			sql= "INSERT INTO bookmark (userId, topicId) VALUES (" +data.userId +", " +data.topicId +")";
		}
		else {
			sql= "DELETE FROM bookmark WHERE userId=" +data.userId +" AND topicId=" +data.topicId;
		}
		mysqlConnection.query(sql, function(err, rows){
			if (err) {
				console.log('Internal error: ', err);
			}
		})
	});
  
	// when the client emits 'new message', this listens and executes
	// we tell the client to execute 'new message'  
	socket.on('client new message', function (data) {
		// write to db
		mysqlConnection.query("INSERT INTO topicchats SET ?", data, function(err, rows){
			if (err) {
				console.log('Internal error: ', err);
			}
			else {
				var nestedRows = func.convertToNested(rows);
				data.id= nestedRows.insertId;
				socket.broadcast.emit('server new topic message', data);
			}
		})
	});

	// when the client emits 'typing', we broadcast it to others
	socket.on('typing', function (data) {
		//console.log(data);
		socket.broadcast.to(data.topicId).emit('typing', data.userName);
	});

	// when the client emits 'stop typing', we broadcast it to others
	socket.on('stop typing', function (data) {
		//console.log(data);
		socket.broadcast.to(data.topicId).emit('stop typing', data.userName);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function () {
		// echo globally that this client has left
		// đoạn này cũng có thể dùng để thông báo ai đã off.
		//console.log("user left");
		socket.broadcast.to(socket.topicId).emit('user left', {
			username: socket.userId,
		});
	});
});

exports = module.exports = app;