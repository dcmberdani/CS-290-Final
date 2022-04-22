/*
 * To handle the server through express
 * 
 */
var express = require('express');
var exphbs = require('express-handlebars')

// from https://socket.io/docs/v4/server-initialization/
const { createServer } = require("http");
const { Server } = require("socket.io");

var app = express();

const httpServer = createServer(app);
const io = new Server(httpServer); // socket io requires an http server

var port = process.env.PORT || 3000;
const GameManager = require("./GameManager")(); // manages ongoing chess games

/*Setting up express-handlebars*/
app.engine('handlebars', exphbs.engine({ defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

app.use(express.static('public'));

app.get('/', function (req, res, next) {
    /*ATM No context needed*/
    res.status(200).render('gamePage', {}) 
});

app.get('/howto', function (req, res, next) {
    /*ATM No context needed*/
    res.status(200).render('howToPage', {}) 
});

app.get('/about', function (req, res, next) {
    /*ATM No context needed*/
    res.status(200).render('aboutPage', {}) 
});

app.get('*', function (req, res) {
    //Maybe grab the url and include it?
    res.status(404).render('404', {}) 
});

/*
 this sets up all the events for socket io
 in index.js, if you see a call to socket.emit("event", data)
 it's sending a message the server will be able to handle below

 the server pairs clients to each other by creating rooms using game ids created by the GameManager
 a room in socket.io is essentially a channel exclusive to the clients that are apart of it

 after two players join a game, then they can send moves to each other via the server
*/
io.on("connection", (socket) => {
    socket.on("create game", () => {
        // create a new game
        let id = GameManager.create_game();
        let game = GameManager.get_game(id);

        // person who created the game joins the room as white
        socket.join(id);
        game.players.white = socket.id;

        console.log("== New game("+ id + ") created for client", socket.id);
        
        io.sockets.in(socket.id).emit("newgame", id); // give client the game id
        // if they give the game id to someone else, then other people can join the game
    });
    socket.on("join", (game_id) => {
        // retrieve the game
        let game = GameManager.get_game(game_id);

        // if game exists and needs a second player
        if (game && game.players.black == null) {
            socket.join(game_id); // put the second player in the room
            game.players.black = socket.id; // keep track of their socket.io id

            console.log("==", socket.id, "joined game", game_id);
            io.sockets.in(socket.id).emit("join success", game_id); // give client the game id
        }
    });
    socket.on("make move", (game_id, move) => {
        let game = GameManager.get_game(game_id);
        
        if (game){
            // make sure someone isn't moving during another's turn
            if (socket.id == game.players.white && game.turn) return;
            if (socket.id == game.players.black && !game.turn) return;

            game.moves.push(move);
            socket.to(game_id).emit("new move", move); // tells the other people in the room the move just made
            game.turn = !game.turn;
            console.log("-", move, "@", game_id);
        }
    });
    socket.on("chat message", (msg) => {
        // this tests if they're part of a game by seeing if they're part of a room other than their
        // private channel
        // it's impossible for a client to be part of more than 1 room because a new socket instance
        // is created with new tabs or browser windows, meaning that having separate tabs/browsers
        // gives different socket instances
        // also we remove sockets from rooms when the game is done
        if (socket.rooms.size == 2) {
            let room_array = Array.from(socket.rooms);
            socket.to(room_array[1]).emit("chat message", msg);
        }
    });

    // ends the game
    socket.on("end game", (id) => {
        let game = GameManager.get_game(id);
        if(game) {
            GameManager.end_game(id);
            socket.to(id).emit("leave", id);
            socket.leave(id);

            console.log("== Closing game", id);
        }
    });

    // leaves specified room on request
    socket.on("leave room", (id) => {
        if (socket.rooms.has(id))
            socket.leave(id);
    });
});

httpServer.listen(port, function () {
    console.log("== Listening on port", port);
    console.log();
});
