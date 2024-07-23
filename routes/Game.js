const express = require("express");
const router = express.Router();
const GameModels = require("../models/GameDetails");
const PlayersCordinates = require("../models/PlayersCordinates");
const bodyParser = require("body-parser");
router.use(bodyParser.json());
const { spawn } = require('child_process');

const generateCodeId = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

//Game entry Point
router.post('/generate-game-id', async (req, res) => {
  const { playerName1, id } = req.body;
  if (!playerName1 || !id) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newGameId = generateCodeId();
    const newGame = new GameModels({
      gameId: newGameId,
      playerName1,
      createdOn: new Date(),
      createdBy: playerName1,
      status: 'waiting',
      AuthorID: id,
    });
    await newGame.save();
    res.status(201).json({ newGame });
  } catch (error) {
    console.error('Error generating game ID:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Second Player entry Point
router.post("/check-game-id", async (req, res) => {
  const { gameId, playerName2, id } = req.body;
  if (!gameId || !playerName2 || !id) {
    return res.status(400).json({
      message: `${
        !gameId ? "GameId" : !playerName2 ? "player2" : "Player ID"
      } is missing`,
      status: false,
    });
  }

  try {
    const game = await GameModels.findOne({ gameId: gameId });
    if (!game) {
      return res.status(404).json({
        message: "GameId not found",
        status: false,
      });
    }

    const playersCordinate = new PlayersCordinates({
      GameDetails: game._id,
      gameId: gameId,
    });
    await playersCordinate.save();

    game.playerName2 = playerName2;
    game.playerName2ID = id;
    game.status = 'playing';
    await game.save();
   
    res.status(200).json({ game });
  } catch (error) {
    console.log("game id don't match");
    res.status(500).json({ message: error.message });
  }
});

// game details regularly fetching
router.get("/game-details", async (req, res) => {
  const { gameId } = req.query;
  if (!gameId) {
    return res.status(400).json({ status: false, message: "Game ID is required"});
  }

  try {
    const gameDetails = await GameModels.findOne({ gameId });
    if (!gameDetails) {
      return res.status(404).json({status: false , message: "Game details not found"});
    } 
    return res.status(200).json({status: true , message: "Fetched Suuccessfully" , gameDetails});

  } catch (error) {
    res.status(500).json({status: false,message: "Internal server error"});
  }
});

 
//user cordinates as which cordinate should be saved
router.post("/store-coordinate", async (req, res) => {
  const { gameId, row, col, currentPlayer } = req.body;

  if (!gameId || row === undefined || col === undefined || currentPlayer === undefined) {
    return res.status(400).json({
      message: "Missing required fields (gameId, row, col, currentPlayer)",
      status: false,
    });
  }

  try {
    const game = await GameModels.findOne({ gameId });
    if (!game) {
      return res.status(404).json({
        message: "GameId not found",
        status: false,
      });
    }

    let playersCordinate = await PlayersCordinates.findOne({ gameId });
    if (!playersCordinate) {
      playersCordinate = new PlayersCordinates({ gameId });
    }

    // Check if the coordinate is already selected
    if (playersCordinate.player1Input.some((p) => p.row === row && p.col === col) || playersCordinate.player2Input.some((p) => p.row === row && p.col === col)) {
      return res.status(400).json({
        message: "Coordinate is already selected",
        status: false,
      });
    }

    if (currentPlayer === 1) {
      playersCordinate.player1Input.push({ row, col });
    } else if (currentPlayer === 2) {
      playersCordinate.player2Input.push({ row, col });
    } else {
      return res.status(400).json({
        message: "Invalid currentPlayer value",
        status: false,
      });
    }

    const winner = checkForWinner(playersCordinate.player1Input, playersCordinate.player2Input);
    if (winner) {
      game.status = "Win";
      playersCordinate.winner = winner;
      if (winner === 1) {
        game.winner = game.AuthorID;
      } else {
        game.winner = game.playerName2ID;
      }
      await game.save();
      await playersCordinate.save();
      return res.status(201).json({
        message: "Game is won by player " + winner,
        status: true,
      });
    }

    playersCordinate.currentPlayer = playersCordinate.player1Input.length === playersCordinate.player2Input.length ? 1 : 2;
    await playersCordinate.save();

    res.status(201).json({
      message: "Coordinates stored successfully",
      status: true,
      playersCordinate: playersCordinate,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      status: false,
    });
  }
});

function checkForWinner(player1Input, player2Input) {
  const directions = [
    { dr: 1, dc: 0 }, // Horizontal
    { dr: 0, dc: 1 }, // Vertical
    { dr: 1, dc: 1 }, // Diagonal /
    { dr: 1, dc: -1 }, // Diagonal \
  ];

  const checkLine = (row, col, dr, dc, playerInput) => {
    let count = 1;

    // Check in the positive direction
    let r = row + dr;
    let c = col + dc;
    while (playerInput.some((p) => p.row === r && p.col === c)) {
      count++;
      r += dr;
      c += dc;
    }

    // Check in the negative direction
    r = row - dr;
    c = col - dc;
    while (playerInput.some((p) => p.row === r && p.col === c)) {
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


router.get('/check-updates', async (req, res) => {
  const { gameId } = req.query;
  if (!gameId) {
    return res.status(404).json({ message: 'Game ID is required' });
  }

  try {
    const game = await GameModels.findOne({ gameId });
    if (!game) {
      return res.status(404).json({ message: 'Game ID not found' });
    }

    let playersCordinate = await PlayersCordinates.findOne({ gameId });
    if (!playersCordinate) {
      return res.status(404).json({ message: 'Player coordinates not found' });
    }

    res.status(200).json({ playersCordinate });
  } catch (error) {
    console.error('Error fetching game details:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post("/all-matches", async (req, res) => {
  const { id } = req.body;
  try {
    const ID = id;
    
    const games = await GameModels.find({
      $or: [{ AuthorID: ID }, { playerName2ID: ID }]
    })
    .populate('playerName1', 'name')
    .populate('playerName2', 'name')
    .populate('AuthorID', 'name')
    .populate('winner', 'name')
    .populate('createdOn', 'createdOn')
    .populate('status', 'status');

    if (!games.length) {
      return res
        .status(404)
        .json({ message: "No games found for this author" });
    }
    console.log("your game is " + games);
    res.status(200).json({ game: games });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.post('/ai-move', async (req, res) => {
  const { gameId, player, board } = req.body;

  // Flag to track if the response has already been sent
  let responseSent = false;

  try {
    const opponent = player === 1 ? 2 : 1;
    const pythonProcess = spawn('python3', ['routes/gomoku.py']); // Update the path

    const input = JSON.stringify({ board, player: parseInt(player), opponent });

    pythonProcess.stdin.write(input);
    pythonProcess.stdin.end();

    let result = '';
    let errorOccurred = false;

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error('Python error:', data.toString());
      errorOccurred = true;
      // Send error response only if not already sent
      if (!responseSent) {
        responseSent = true;
        res.status(500).json({ error: 'Error in Python script' });
      }
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        // Send error response only if not already sent
        if (!responseSent) {
          responseSent = true;
          res.status(500).json({ error: 'Python script exited with error' });
        }
        return;
      }

      if (!errorOccurred) {
        try {
          const { board, move, winner } = JSON.parse(result);
          
          // Save the move to the game in the database if needed
          // ...

          // Send success response only if not already sent
          if (!responseSent) {
            responseSent = true;
            res.status(200).json({ board, move, winner });
          }
        } catch (error) {
          console.error('Error parsing result:', error);
          // Send error response only if not already sent
          if (!responseSent) {
            responseSent = true;
            res.status(500).json({ error: 'Failed to parse AI response' });
          }
        }
      }
    });

  } catch (error) {
    console.error('Error calculating AI move:', error);
    // Send error response only if not already sent
    if (!responseSent) {
      responseSent = true;
      res.status(500).json({ error: 'Failed to calculate AI move' });
    }
  }
});


 
module.exports = router;
