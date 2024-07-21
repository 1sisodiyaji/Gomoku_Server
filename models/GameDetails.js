const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  playerName1: {
    type: String,
    required: true
  },
  playerName2: {
    type: String,
    required: false // Assuming the second player may join later
  },
  playerName2ID:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Win','Lose','waiting'],
    default: 'waiting'
  },
  winner : {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  AuthorID:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true  // Assuming User model is defined elsewhere and has an ID field
  }
});

const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
