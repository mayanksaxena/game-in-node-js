// Simple Node & Socket server

var http = require('http')
, url = require('url')
, fs = require('fs')
, io = this.socket_io = require('socket.io')
, sys = require('sys')
, chat = require("./chat")
, game = require("./game")
, server;

env = process.env.NODE_ENV || 'development',
port = process.argv[2] || process.env.PORT || 8888,
address = '0.0.0.0';

server = http.createServer(function(req, res){
	var path = url.parse(req.url).pathname;

	//Request Handling
	switch (path){
		
		case '/':
			res.write("<a style='position:absolute; left:42%; top: 38%;' href='/move'><img src='/webroot/images/game.png'/></a>", 'utf8');
			res.end();
			break;
			
		case '/webroot/images/eraseall.jpg':
		case '/webroot/images/pencil.jpg':
		case '/webroot/images/rubber.jpg':
		case '/webroot/images/loader.gif':
		case '/webroot/images/start.png':
		case '/webroot/images/game.png':
			loadFile(__dirname + path, res, 'image/jpeg');
			break;
		
		case '/webroot/js/game_client.js':
		case '/webroot/js/jquery.js':
			loadFile(__dirname + path, res, 'text/javascript');
			break;
		
		case '/webroot/css/style.css':
			loadFile(__dirname + path, res, 'text/css');
			break;
	
		case '/move':
			loadFile(__dirname + "/move.html", res, 'text/html');
			break;
		
		default: send404(res);
	}
	
}).listen(port);

send404 = function(res){
	res.writeHead(404);
	res.write('404');
	res.end();
};

function loadFile(path, res, contentType) {
	fs.readFile(path, function(err, data){
		if (err) return send404(res);
		res.writeHead(200, {'Content-Type': contentType})
		res.write(data, 'utf8');
		res.end();
	});
}

var io = io.listen(server);

io.sockets.on('connection', function(client){
	console.log(client.id);
	var gameModule = new game(io, client);
	var chatModule = new chat(io, client, gameModule);
});