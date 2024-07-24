const express = require("express");
const bodyParser = require("body-parser"); 
const cookieParser = require("cookie-parser"); 
const cors = require("cors"); // Import the cors package
require("dotenv").config();
const database = require('./config/Database'); 
const user = require("./routes/user");
const game = require("./routes/Game");

const app = express();
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json());
app.use(cookieParser()); 

// CORS configuration
const allowedOrigins = ["https://gomoku-gray.vercel.app", "http://localhost:3000"];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: "GET, POST, PUT, DELETE, OPTIONS",
  allowedHeaders: "Content-Type, Authorization",
  credentials: true,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Ensure CORS middleware is applied before your routes
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
