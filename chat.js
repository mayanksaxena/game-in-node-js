// <summary>
//     Initialise a new instance of Chat.
// </summary>
var Chat = function(io, socket, gameModule) {
    if(false === (this instanceof Chat)) {
        return new Chat();
    }
	
	this.init(io, socket, gameModule);
}

// <summary>
//     ProtoType methods and properties for Chat.
// </summary>
Chat.prototype = {

	// usernames which are currently connected to the chat
	usernames : {},

	// rooms which are currently available in chat
	rooms : ['room1','room2','room3'],

	game : [],
	
	// <summary>
	// 	Initialize the Chat module.
	// </summary>
	// <param name="io">Socket IO instance</param>
	// <param name="socket">client instance</param>
	init : function(io, socket, gameModule) {
		var slef = this;

		// when the client emits 'adduser', this listens and executes
		socket.on('adduser', function(data){
			var clients = io.sockets.clients(data.gameID);
			//If no of users in the game is greater then two
			if(clients.length < 2) {
				// store the username in the socket session for this client
				socket.username = data.username;
				// store the room name in the socket session for this client
				socket.room = data.gameID;
				// add the client's username to the global list
				slef.usernames[data.username] = data.username;
				// send client to room 1
				socket.join(data.gameID);
				// echo to client they've connected
				socket.emit('updatechat', 'SERVER', 'you have connected to room1');
				// echo to room 1 that a person has connected to their room
				socket.broadcast.to(data.gameID).emit('updatechat', 'SERVER', data.username + ' has connected to this room');
				socket.broadcast.to(data.gameID).emit('updatecount', "Total number of persons in this game: "+clients.length);
			} else {
				//DONT ALLOW USER TO PLAY THE GAME
				socket.emit('gameisFull', "Game is already full please try again later...");
			}
		});

		// when the client emits 'sendchat', this listens and executes
		socket.on('sendchat', function (data) {
			// we tell the client to execute 'updatechat' with 2 parameters
			io.sockets.in(socket.room).emit('updatechat', socket.username, data);
		});

		socket.on('switchRoom', function(newroom){
			socket.leave(socket.room);
			socket.join(newroom);
			socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
			// sent message to OLD room
			socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
			// update socket session room title
			socket.room = newroom;
			socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
			socket.emit('updaterooms', slef.rooms, newroom);
		});


		// when the user disconnects.. perform this
		socket.on('disconnect', function(){
			console.log("In disconnect..");
			// remove the username from global usernames list
			delete Chat.prototype.usernames[socket.username];
			// update list of users in chat, client-side
			io.sockets.emit('updateusers', Chat.prototype.usernames);
			// echo globally in the room that this client has left
			socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username + ' has disconnected');
			var clients = io.sockets.clients(socket.room);
			socket.broadcast.to(socket.room).emit('updatecount', "Total number of persons in this game: "+clients.length-1);
			delete gameModule.task[socket.room];
			delete gameModule.master[socket.room];
			delete gameModule.timer[socket.room]
			socket.leave(socket.room);
		});
	}
}

// Replace the module prototype with Chat.
module.exports = Chat;
