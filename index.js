const express = require("express");
const bodyParser = require("body-parser"); 
const cookieParser = require("cookie-parser"); 
require("dotenv").config();
const database = require('./config/Database'); 
const user = require("./routes/user");
const game = require("./routes/Game");

const app = express();
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json());
app.use(cookieParser()); 

// Middleware to handle CORS
app.use((req, res, next) => {
  const allowedOrigins = ["https://gomoku-gray.vercel.app", "http://localhost:3000"];
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

app.use("/api", user);
app.use("/game", game);

app.get("/", (req, res) => {
  res.json({ message: "Hello from server" });
});

const port = process.env.PORT || 5057;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
