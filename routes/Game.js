const express = require("express");
const router = express.Router();
const GameModels = require("../models/GameDetails");
const PlayersCordinates = require("../models/PlayersCordinates");
const bodyParser = require("body-parser");
router.use(bodyParser.json());

const generateCodeId = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

router.post("/generate-game-id", async (req, res) => {
  const { playerName1, id } = req.body;
  if (!playerName1 || !id) {
    return res.status(400).json({
      message: `${!playerName1 ? "player1 name" : "GameId"} is missing`,
      status: false,
    });
  }

  try {
    const newGameId = generateCodeId();
    const newGame = new GameModels({
      gameId: newGameId,
      playerName1,
      createdOn: new Date(),
      createdBy: playerName1,
      status: "waiting",
      AuthorID: id,
    });
    await newGame.save();
    res.status(201).json({ newGame });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
    await game.save();
    // Emit an event to notify that Player 2 has joined
    //  const io = req.app.get('io');
    //  io.to(gameId).emit('player2-joined', { gameId, playerName2 });

    res.status(200).json({ game });
  } catch (error) {
    console.log("game id don't match");
    res.status(500).json({ message: error.message });
  }
});

router.post("/store-coordinate", async (req, res) => {
  const { gameId, row, col, currentPlayer } = req.body; 

  if (
    !gameId ||
    row === undefined ||
    col === undefined ||
    currentPlayer === undefined
  ) {
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

    if (currentPlayer === 1) {
      playersCordinate.player1Input.push({ row: row, col: col });
    } else if (currentPlayer === 2) {
      playersCordinate.player2Input.push({ row: row, col: col });
    } else {
      return res.status(400).json({
        message: "Invalid currentPlayer value",
        status: false,
      });
    }

    const winner = checkForWinner(
      playersCordinate.player1Input,
      playersCordinate.player2Input
    );
    if (winner) {
      GameModels.status = "Win";

      playersCordinate.winner = winner;
      if (winner === 1) {
        GameModels.winner = AuthorID;
      } else {
        GameModels.winner = playerName2ID;
      }
      GameModels.save();
    }

    playersCordinate.currentPlayer =
      playersCordinate.player1Input.length ===
      playersCordinate.player2Input.length
        ? 1
        : 2;

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
    console.log(count);
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

router.get("/game-details", async (req, res) => {
  const { gameId } = req.query;
  if (!gameId) {
    return res.status(400).json({
      message: "Game ID is required",
      status: false,
    });
  }

  try {
    const gameDetails = await GameModels.findOne({ gameId });
    if (!gameDetails) {
      return res.status(404).json({
        message: "Game details not found",
        status: false,
      });
    }

    res.status(200).json({ gameDetails });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      status: false,
    });
  }
});

router.get("/winner-details", async (req, res) => {
  const { gameId } = req.query;
  if (!gameId) {
    return res.status(400).json({
      message: "Game ID is required",
      status: false,
    });
  }

  try {
    const gameDetails = await PlayersCordinates.findOne({ gameId });
    if (!gameDetails) {
      return res.status(404).json({
        message: "Game details not found",
        status: false,
      });
    }

    res.status(200).json({ gameDetails });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      status: false,
    });
  }
});

router.post("/all-matches", async (req, res) => {
  const { id } = req.body;
  try {
    const authorId = id;
    console.log(authorId);
    if(!authorId){
      return res.status(400).json({
        message: "Author ID is required",
        status: false,
      });
    }

    const games = await GameModels.find({ AuthorID: authorId })
    .populate('playerName2ID', 'name')
    .populate('AuthorID', 'name')
    .populate('winner', 'name')
    .populate('createdOn', 'createdOn')
    .populate('status' ,'status');

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

module.exports = router;
