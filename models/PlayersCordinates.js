const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const  GameDetails=require('./GameDetails');

const cordinateschema = new Schema({
    GameDetails: {
        type: Schema.Types.ObjectId,
        ref: 'Game',
        required: true,
        unique: true
      },
     
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  player1Input: [{
    row: { type: Number, required: true },
    col: { type: Number, required: true }
  }],
  player2Input: [{
    row: { type: Number, required: true },
    col: { type: Number, required: true }
  }],
  winner: {
    type: Number, // 1 for player 1, 2 for player 2, null if no winner yet
    default: null
  },
  currentPlayer: {
    type: Number, // Current player turn (1 or 2)
    default: 1
  }
});

const Game = mongoose.model('cordinates', cordinateschema);

module.exports = Game;
