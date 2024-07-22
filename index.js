const express = require("express");
const { spawn } = require('child_process');
const bodyParser = require("body-parser"); 
const cookieParser = require("cookie-parser"); 
require("dotenv").config();
const database = require('./config/Database'); 
const user = require( "./routes/user");
const Game = require ( "./routes/Game");

const app = express();
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser()); 

// Middleware to handle CORS
app.use((req, res, next) => {
  const allowedOrigins = ["https://gomoku-gray.vercel.app", "http://localhost:3000" ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
  } else {
    next();
  }
});

database();


app.use("/api/", user); 
app.use("/game/" , Game); 
app.post('/game/ai', (req, res) => {
  const { board, player, opponent } = req.body;
  const pythonProcess = spawn('python3', ['gomoku.py']);
  pythonProcess.stdin.write(JSON.stringify({ board, player, opponent }));
  pythonProcess.stdin.end();

  let dataString = '';

  pythonProcess.stdout.on('end', () => {
    const result = JSON.parse(dataString);
    console.log(result);
    res.json(result);
  });

  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });
});

app.get("/" , (req,res) => {
  res.json({message : "Hello from server"});
});



const port = process.env.PORT || 5057;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});

