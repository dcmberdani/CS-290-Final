//Grabs navbar items
var navBarAbout = document.getElementById('navAbout')
var navBarHowto = document.getElementById('navHowto')
var navBarPlaceholder = document.getElementById('navPlaceholder')

/*
Adds a click listener to the navbar for navbar items
Delegation is used to share a single click listener between nav elements
*/
var navBar = document.getElementById('navbar')
navBar.addEventListener('click', function (event) {
    if (event.target == navBarAbout)
        window.location.href = "./about";
    
    if (event.target == navBarHowto)
        window.location.href = "./howto";

    if (event.target == navBarPlaceholder)
        window.location.href = "./placeholder";

})


/////////////////////////////////////////
// Socket IO Client Functions and Init //
/////////////////////////////////////////
const socket = io();
let game_id = null;

// runs when the server creates a game for this client
// after the server creates the game, the client will receieve the game id
socket.on("newgame", (data) => {
    game_id = data; // save the game we're apart of
    console.log("== Created game:", game_id);
    document.getElementById('game_id').textContent = game_id;
    send_message("Game ID:", game_id);
    send_message("Send this ID to someone else and they can join your game!");
});

// runs when we successfully join a game
socket.on("join success", (data) => {
    game_id = data;
    document.getElementById('game_id').textContent = game_id;
});

// runs when the other person makes a move
socket.on("new move", (data) => {
    console.log("== New Move:", data);
});

// runs everytime this client gets a chat message
// currently just prints out to console
socket.on("chat message", (msg) => {
    console.log("== Message Recieved:", msg);
});

// recieves message from server to leave room
socket.on("leave", (id) => {
    socket.emit("leave room", id);
});

// asks the server to create a game
function create() {
    if(game_id != null)
        return;

    socket.emit("create game", '');
}

// tells the server that this client wants to join a game
function join(id) {
    // get the id from user input, probably using <input>
    if(id != undefined) {
        socket.emit("join", id);
    } else {
        let g_id = document.getElementById('join_id').value;
        socket.emit("join", g_id);
    }
}

// tells the server that this client wants to make a move
// make sure that the parameter is the move that's made
function move(m) {
    if (m != null)
        socket.emit("make move", game_id, m);
}

// close a game when done
function end_game() {
    if (game_id != null) {
        socket.emit("end game", game_id);
    }
}

//Sets up the live-chat with the other player
var chatMessages = document.getElementById('chat-messages')
var chatForm = document.getElementById('chat-form')
var chatInput = document.getElementById('chat-input')

chatForm.addEventListener('submit', function(e) {
    e.preventDefault()
    if (chatInput.value) {
        //Locally appends the message so the sender sees it as well
        var chatMessage = document.createElement('li');
        chatMessage.textContent = "You: " + chatInput.value;
        chatMessages.appendChild(chatMessage);

        send_message(chatInput.value)

        //Scroll to bottom of chat window and reset the value inside
        chatMessages.scrollTop = chatMessages.scrollHeight
        chatInput.value = ''
    }
})

socket.on("chat message", function(msg) {
    //Sends the message to the other player
    var chatMessage = document.createElement('li');
    chatMessage.textContent = "Other Player: " + msg;
    chatMessages.appendChild(chatMessage);

    //Scroll to bottom of chat window and reset the value inside
    chatMessages.scrollTop = chatMessages.scrollHeight
    chatInput.value = ''
});

// sends message to the other player
function send_message(msg) {
    socket.emit("chat message", msg);
}