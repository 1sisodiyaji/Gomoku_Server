const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const database = require('./config/Database');
const user = require("./routes/user");
const game = require("./routes/Game");

const app = express();
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// CORS configuration
const corsOptions = {
  origin: "*",  
  credentials: true,
};

// Apply CORS middleware
app.use(cors(corsOptions));

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
