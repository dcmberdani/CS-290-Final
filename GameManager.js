// gives a unique 8-char id for a game
// takes a set of existing ids to make sure that
// we don't re-use any
// it's kinda inefficient but oh well
function generate_unique_game_id (keys) {
    let possible = '1234567890qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';
    let new_id = '';
    do {
        new_id = '';
        for (let i = 0; i < 8; i++)
            new_id += possible.charAt(Math.floor(Math.random() * possible.length));
    } while (keys.includes(new_id)); // check to make sure doesn't exist in our keys
    return new_id;
}

module.exports = function Manager () {
    // dictionary of games
    // each game has a unique id which is 8 characters and a mix between letters and numbers
    // ex: 4gg2k2ff
    // the id is used in socket.io to initialize a room which two players can join
    // this is somewhat similar to lichess game ids
    // that corresponds to another structure which is:
    // {
    //      moves: ["e4", "e5"]... // array of the moves
    // }
    this.games = {};

    // initializes a game in the default position
    this.create_game = function () {
        let id = generate_unique_game_id(Object.keys(this.games));
        this.games[id] = {
            moves: [], // this is the empty moves array
            players: { // stores socket.io ids
                white: null,
                black: null
            },
            turn: false // false = white, true = black
        }
        return id; // used by server.js to create a room
    }

    // if the game exists in our games dictionary, return it
    // returns false so that this function can check if games exist as well
    this.get_game = function (id) {
        return id in this.games ? this.games[id] : false;
    }

    // deletes a game if it exists
    this.end_game = function (id) {
        let rm_id = this.get_game(id);
        if (rm_id) {
            delete this.games[rm_id];
        }
    }

    return this;
}