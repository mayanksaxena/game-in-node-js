// <summary>
//     Initialise a new instance of Game.
// </summary>
var Game = function(io, socket) {
    if(false === (this instanceof Game)) {
        return new Game();
    }
	
	this.init(io, socket);
}

// <summary>
//     ProtoType methods and properties for Game.
// </summary>
Game.prototype = {

	// usernames which are currently connected to the Game
	makeid: function() {
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	
		for( var i=0; i < 10; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));
	
		return text;
	},

	/**
	 * Returns a random integer between min and max
	 * Using Math.round() will give you a non-uniform distribution!
	 */
	getRandomInt: function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},
	
	master: {},
	
	task: {},

	timer: {},

	gameObjects: ['home', 'dog', 'fan', 'mobile', 'car', 'earth'],
	
	// <summary>
	// 	Initialize the Game module.
	// </summary>
	// <param name="io">Socket IO instance</param>
	// <param name="socket">client instance</param>
	init : function(io, socket) {
		var slef = this;
		
		//send the master control
		io.sockets.in(socket.room).emit("control", Game.prototype.master[socket.room]);
	
		//If client moves the box
		socket.on("message", function(msg) {
			socket.broadcast.to(socket.room).emit("message", msg);
		});
		
		socket.on("guess", function(msg) {
			task = Game.prototype.task[socket.room];
			if(task != msg.data) {
				socket.emit("guess","Sorry wrong guess please try again.");
			} else {
				io.sockets.in(socket.room).emit("guess","Hurrah!! you win the game.");
				socket.broadcast.to(socket.room).emit("guess",{"game" : "over"});
			}
		});

		//If client press the take the control.
		socket.on("control", function(msg) {
			//If quit the control
			if(msg.my == "quit") {
				delete Game.prototype.master[socket.room];
				delete Game.prototype.task[socket.room];
				clearInterval(Game.prototype.timer[socket.room]);
				delete Game.prototype.timer[socket.room];
			} else {
				Game.prototype.master[socket.room] = socket.id;
				task = Game.prototype.gameObjects[Game.prototype.getRandomInt(0, Game.prototype.gameObjects.length-1)];
				Game.prototype.task[socket.room] = task;
				socket.emit("guess",{"gametask": task});
			}
			if(typeof Game.prototype.master[socket.room] !== "undefined" && Game.prototype.master[socket.room] != "") {
				var  i = 40;
				Game.prototype.timer[socket.room] = setInterval(function(){
					//If user quits or session time out.
					if(i == 0 || Game.prototype.master[socket.room] == "") {
						clearInterval(Game.prototype.timer[socket.room]);
						delete Game.prototype.timer[socket.room];
						delete Game.prototype.master[socket.room];
						socket.broadcast.to(socket.room).emit("timeZone","Try Now.....");
						io.sockets.in(socket.room).emit("control", Game.prototype.master[socket.room]);
						socket.broadcast.to(socket.room).emit("control", Game.prototype.master[socket.room]);
					} else {
						socket.broadcast.to(socket.room).emit("timeZone","you will get the chance to take the control in "+i+" seconds...");
					}
					i--;
				},1000);
			}
			//Broadcast the current control status.
			socket.broadcast.to(socket.room).emit("control", Game.prototype.master[socket.room]);
		});
	}
}

// Replace the module prototype with Game.
module.exports = Game;
