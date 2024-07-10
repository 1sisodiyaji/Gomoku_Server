const mongoose = require("mongoose");

const Database = async () => {
  // Connect to MongoDB
  const uri = process.env.MONGO_DB_URL;
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

module.exports = Database;
