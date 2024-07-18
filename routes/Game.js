const express = require('express');
const router = express.Router();
const GameModels = require('../models/GameDetails');
const PlayersCordinates = require('../models/PlayersCordinates');
const bodyParser = require('body-parser');
router.use(bodyParser.json());
const generateCodeId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

router.post('/generate-game-id', async (req, res) => {
  const { playerName1 , id} = req.body;
  try {
    if (!playerName1) {
      return res.status(404).json({
        message: "player1 name is missing",
        status: false
      });
    }
    if (!id) {
        return res.status(404).json({
          message: "GameId is missing",
          status: false
        });
    }

    const newGameId = generateCodeId();
    const newGame = new GameModels({
      gameId: newGameId,
      playerName1: playerName1,
      createdOn: new Date(),
      createdBy: playerName1,
      status: 'waiting',
      AuthorID: id,
    });
    await newGame.save();
    res.status(201).json({ newGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/check-game-id', async (req, res) => {
  const { gameId, playerName2 ,id } = req.body; 
  try {
    if (!gameId || !playerName2) {
      return res.status(404).json({
        message: "player2 and gameId are missing",
        status: false
      });
    }
    if(!id){
        return res.status(404).json({
            message: "Player ID is missing",
            status: false
        });
    }
    const game = await GameModels.findOne({ gameId: gameId });
    if (!game) {
      return res.status(404).json({
        message: "GameId is not found",
        status: false
      });
    }
    const playersCordinate = new PlayersCordinates({
      GameDetails: game._id,
      gameId: gameId,
    });
    await playersCordinate.save();

    game.playerName2 = playerName2;
    game.playerName2ID = id;
    await game.save();

    res.status(200).json({ game });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log("game id don't match");
  }
});

router.post('/store-coordinate', async (req, res) => {
  // const { gameId, row, col, currentPlayer } = req.body;
  const { gameId, row, col, currentPlayer } = req.body;
  console.log(gameId);
  console.log(row);
  console.log("Type of row is:", typeof currentPlayer);

  console.log(col);
  console.log("Type of col is:", typeof currentPlayer);

  console.log(currentPlayer);
  console.log("Type of currentPlayer is:", typeof currentPlayer);

  try {
    // if (!gameId || row === undefined || col === undefined || currentPlayer === undefined)
    if (!gameId || row === undefined || col === undefined || currentPlayer === undefined) {
      return res.status(400).json({
        message: "Missing required fields (gameId, row, col, currentPlayer)",
        status: false
      });
    }

    const game = await GameModels.findOne({ gameId });
    console.log("game is :", game);
    if (!game) {
      return res.status(404).json({
        message: "GameId is not found",
        status: false
      });
    }

    let playersCordinate = await PlayersCordinates.findOne({ gameId });
    console.log("Player cordinate is :", playersCordinate)
    if (!playersCordinate) {
      playersCordinate = new PlayersCordinates({ gameId });
    }

    if (currentPlayer === 1) {
      playersCordinate.player1Input.push({ row: row, col: col });
      console.log("Db m cordinate save ho gya 1");
    } else if (currentPlayer === 2) {
      playersCordinate.player2Input.push({ row: row, col: col });
      console.log("Db n cordinate save ho gya 2");
    }
    else {
      return res.status(400).json({
        message: "Invalid currentPlayer value",
        status: false
      });
    }

    const winner = checkForWinner(playersCordinate.player1Input, playersCordinate.player2Input);
    console.log('winner is :', winner);
    if (winner) {
      playersCordinate.winner = winner;
    }

    playersCordinate.currentPlayer = playersCordinate.player1Input.length === playersCordinate.player2Input.length ? 1 : 2;

    await playersCordinate.save();

    res.status(201).json({
      message: "Coordinates stored successfully",
      status: true,
      playersCordinate: playersCordinate // Optional: Return winner information
    });
  } catch (error) {
    console.error("Error storing coordinates:", error);
    res.status(500).json({
      message: "Internal server error",
      status: false
    });
  }
});

function checkForWinner(player1Input, player2Input) {
  const directions = [
    { dr: 1, dc: 0 },  // Horizontal
    { dr: 0, dc: 1 },  // Vertical
    { dr: 1, dc: 1 },  // Diagonal /
    { dr: 1, dc: -1 }  // Diagonal \
  ];

  const checkLine = (row, col, dr, dc, playerInput) => {
    let count = 1;

    // Check in the positive direction
    let r = row + dr;
    let c = col + dc;
    while (playerInput.some(p => p.row === r && p.col === c)) {
      count++;
      r += dr;
      c += dc;
    }

    // Check in the negative direction
    r = row - dr;
    c = col - dc;
    while (playerInput.some(p => p.row === r && p.col === c)) {
      count++;
      r -= dr;
      c -= dc;
    }

    return count >= 5;
  };

  for (const { row, col } of player1Input) {
    for (const { dr, dc } of directions) {
      if (checkLine(row, col, dr, dc, player1Input)) {
        return 1;
      }
    }
  }

  for (const { row, col } of player2Input) {
    for (const { dr, dc } of directions) {
      if (checkLine(row, col, dr, dc, player2Input)) {
        return 2;
      }
    }
  }

  return null;
}

router.get('/game-details', async (req, res) => {
  const { gameId } = req.query;
  try {
    if (!gameId) {
      console.log("Game ID is not found in query parameters");
      return res.status(400).json({
        message: "Game ID is required",
        status: false
      });
    }

    const gameDetails = await GameModels.findOne({ gameId });

    if (!gameDetails) {
      console.log("Game details not found for gameId:", gameId);
      return res.status(404).json({
        message: "Game details not found",
        status: false
      });
    }

    return res.status(200).json({
      gameDetails // Return gameDetails in the response
    });

  } catch (error) {
    console.error("Error fetching game details:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      status: false
    });
  }
});


router.get('/winner-details', async (req, res) => {
  const { gameId } = req.query; // Use req.query to get parameters from query string
  console.log("gameId IS for winner fetching",gameId);
  try {
    if (!gameId) {
      console.log("Game ID is not found in query parameters");
      return res.status(400).json({
        message: "Game ID is required",
        status: false
      });
    }

    const gameDetails = await PlayersCordinates.findOne({ gameId });

    if (!gameDetails) {
      console.log("Game details not found for gameId:", gameId);
      return res.status(404).json({
        message: "Game details not found",
        status: false
      });
    }

    return res.status(200).json({
      gameDetails // Return gameDetails in the response
    });

  } catch (error) {
    console.error("Error fetching game details:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      status: false
    });
  }
});

module.exports = router;
