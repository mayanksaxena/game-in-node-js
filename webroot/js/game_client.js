function makeid(len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

var domainURL = "http://mayanksaxena.aws.af.cm";//"http://localhost:8888";//"http://arcane-thicket-2267.herokuapp.com";//;

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function initSocket(game) {
	//Connection to the socket. "http://localhost:"+$("#portmak").val()"http://localhost:"+$("#portmak").val();
    //var urlSocket = "http://localhost";//"http://mayanksaxena.aws.af.cm/";//"http://localhost:"+$("#portmak").val();//
	var socket = io.connect(domainURL);
	console.log('check 1', socket.socket.connected);
	if(!socket.socket.connected) {
		$("#loader").show();
		$(".overlay").removeClass("hide");
	}
	// listener, whenever the server emits 'updatechat', this updates the chat body
	socket.on('updatechat', function (username, data) {
		$('#conversation').append('<b>'+username + ':</b> ' + data + '<br>');
	});

	socket.on('gameisFull', function(msg) {
		$("#game_init_area").show();
		$("#game_area").hide();
		alert(msg);
	});

	// listener, whenever the server emits 'updaterooms', this updates the room the client is in
	socket.on('updaterooms', function(rooms, current_room) {
		$('#rooms').empty();
		$.each(rooms, function(key, value) {
			if(value == current_room){
				$('#rooms').append('<div>' + value + '</div>');
			}
			else {
				$('#rooms').append('<div><a class="rooms" href="#" data="'+value+'">' + value + '</a></div>');
			}
		});
		$(".rooms").unbind("click").bind("click", function(){
		 	socket.emit('switchRoom', $(this).attr("data"));
		 });
	});

	// on connection to server, ask for user's name with an anonymous callback
	socket.on('connect', function(){
		// call the server-side function 'adduser' and send one parameter (value of prompt)
		socket.emit('adduser', { username: makeid(5), gameID: game } );
		//prompt("What's your name?")
	});

	//If control channel is open.
	 socket.on('control', function (data) {
	 	console.log(socket.socket.connected);
	 	if(socket.socket.connected) {
	 		$("#loader").hide();
	 		$(".overlay").addClass("hide");
	 	}
		//If someone else has the control.
		if(data != null && data != ""){
			$("#takeControl").hide();
			$("#quit").hide();
			$("#error").show();
			$("#timeRemain").html("");
		} else {
			$("#takeControl").show();
			$("#quit").hide();
			$("#mybody").unbind("mousemove");
			$("#error").hide();
			$("#timeRemain").html("");
			$("#eraser").hide();
			$("#draw").hide();
			$("#eraseAll").hide();
			$("#drawobject").unbind("mousemove");
		}
	 });
	 //Get the coordniates from the master.
	 socket.on('message', function(obj){ 
		var obj = JSON.parse(obj);
		if(typeof obj.eraseAll !== "undefined" && obj.eraseAll) {
			$("#drawobject").html("");
		} else {
			if(!obj.iseraser) {
				//append it to body
				$("#drawobject").append(drawline("#000", "5px", obj.pointY, obj.pointX));
			} else {
				$("#drawobject").append(drawline("#CEF6F5", "10px", obj.pointY, obj.pointX));
			}
		}
		
	});
	 //If control channel is open.
	 socket.on('timeZone', function (data) {
		$("#timeRemain").html(data);
	 });

	 //Update the count of players in the game
	 socket.on('updatecount', function(msg) {
	 	$("#countUsers").html(msg);
	 });
	 
	 //Response of guess
	 socket.on('guess', function (data) {
	 	console.log(data);
	 	console.log("In if callback");
		$("#challengeTask").removeClass();
		if(typeof data.game !== "undefined" && data.game == "over") {
			$("#quit").trigger("click");
			$("#challengeTask").html("Game over. His/her guess was correct.");
			$("#challengeTask").addClass("highlight");
		} else if(typeof data.gametask !== "undefined") {
			$("#challengeTask").html("Draw:-"+data.gametask);
			$("#challengeTask").addClass("highlight");
		} else {
			$("#challengeTask").html(data);
			$("#challengeTask").addClass("winner");
		}
	 });

	 // when the client clicks SEND
	$('#datasend').click( function() {
		var message = $('#data').val();
		$('#data').val('');
		$('#data').focus();
		$('#conversation').animate({ scrollTop: $('#conversation')[0].scrollHeight}, 100);
		// tell server to execute 'sendchat' and send along one parameter
		socket.emit('sendchat', message);
	});

	//If person quits the control.
	 $("#quit").click(function(){
	 	socket.emit('control', { my: 'quit' });
		$("#takeControl").show();
		$("#quit").hide();
		$("#eraser").hide();
		$("#draw").hide();
		$("#eraseAll").hide();
		$("#mybody").unbind("mousemove");
		$("#timeRemain").html("");
		$(document).unbind("mousedown");
		$(document).unbind("mouseup");
		$("#drawobject").html("");
		$("#drawobject").unbind("mousemove");
		$("#challengeTask").html("");
		$("#guess").val("");	
	 });
	 
	 $("#guessSubmit").click(function(){
		socket.emit('guess', { data: $("#guess").val() });
	 });
	 //If person takes the control.
	$("#takeControl").click(function(){
		socket.emit('control', { my: 'data' });
		$("#takeControl").hide();
		$("#quit").show();
		$("#eraser").show();
		$("#draw").show();
		$("#eraseAll").show();
		var draw = false;
		var eraser = false;
		$("#draw").addClass("active");
		$("#eraser").unbind("click").bind("click", function() {
			$("#draw").removeClass("active");
			$("#eraseAll").removeClass("active");
			$(this).addClass("active");
			eraser = true;
		});
		$("#draw").unbind("click").bind("click", function() {
			$("#eraser").removeClass("active");
			$("#eraseAll").removeClass("active");
			$(this).addClass("active");
			eraser = false;
		});
		$("#eraseAll").unbind("click").bind("click", function(){
			$("#eraser").removeClass("active");
			$("#draw").removeClass("active");
			$(this).addClass("active");
			var points = { pointX:'', pointY:'', iseraser: eraser, eraseAll: true};
			points = JSON.stringify(points);
			socket.send(points);
			$("#drawobject").html("");
		});
		//set it true on mousedown
		$(document).unbind("mousedown").bind("mousedown", function(){
			draw=true;
		});

		//reset it on mouseup
		$(document).unbind("mouseup").bind("mouseup", function(){
			draw=false;
		});



		//If person moves the mouse.
		$("#drawobject").bind("mousemove",function(e){
			setTimeout(function(){
				var points = { pointX:e.pageX, pointY:e.pageY, iseraser: eraser};
				points = JSON.stringify(points);
				//if mouse is down
				if(draw==true) {
					if(!eraser) {
						$("#drawobject").append(drawline("#000", "5px", e.pageY, e.pageX));
					} else {
						$("#drawobject").append(drawline("#CEF6F5", "10px", e.pageY, e.pageX));
					}
					socket.send(points);
				}
			},100);
		});
	});
}

$(document).ready(function() {

	if( getParameterByName("guid").length > 0 ){
		initSocket(getParameterByName("guid"));
		$("#game_init_area").hide();
		$("#game_area").show();
	}
	
	$("#quit").hide();

	$("#start_a_new_game").click(function(){
		gameurl = domainURL +"/move?guid="+ makeid(10);
		$("#game_links_area").html("<a href='"+gameurl+"'>"+gameurl+"</a>");
	});

	

	// when the client hits ENTER on their keyboard
	$('#data').keypress(function(e) {
		if(e.which == 13) {
			$(this).blur();
			$('#datasend').focus().click();
		}
	});
	 
});
function drawline(color, size, yposition, xposition) {
	//make a pixel (5X5) at mouse position
	pointer = $('<span>').css({
		'position':'absolute',
		'background-color':color,
		'width':size,
		'height': size,
		top: yposition ,    //offsets
		left: xposition   //offsets
	});
	return pointer;	
}