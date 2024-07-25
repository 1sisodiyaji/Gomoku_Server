const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser"); 
require("dotenv").config();
const database = require('./config/Database');
const user = require("./routes/user");
const game = require("./routes/Game");
const cors = require('cors');

const app = express();
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
 
// Apply CORS middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

database();
// Your routes
app.use("/api", user);
app.use("/game", game);

app.get("/", (req, res) => {
  res.json({ message: "Hello from server" });
});

const port = process.env.PORT || 5057;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
