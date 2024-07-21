const express = require("express");
const bodyParser = require("body-parser"); 
const cookieParser = require("cookie-parser");
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
require("dotenv").config();
const database = require('./config/Database'); 
const user = require( "./routes/user");
const Game = require ( "./routes/Game");

const app = express();
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Middleware to handle CORS
app.use((req, res, next) => {
  const allowedOrigins = ["http://localhost:3000" , "https://gomoku-gray.vercel.app"];
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

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000" , "https://gomoku-gray.vercel.app"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(cors({
  origin:  ["http://localhost:3000" , "https://gomoku-gray.vercel.app"],
  methods: ["GET", "POST"],
  credentials: true,
}));


io.on('connection', (socket) => {
  console.log('connected ...');

  socket.on('move', (data) => {
    io.emit('move', data);
  });
 

  socket.on('disconnect', () => {
    console.log('disconnected');
  });
});


app.use("/api/", user); 
app.use("/game/" , Game);

app.get("/" , (req,res) => {
  res.json({message : "Hello from server"});
});


const port = process.env.PORT || 5057;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




