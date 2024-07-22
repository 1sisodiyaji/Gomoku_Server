
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String , trim : true},
  email: { type: String, required: true, unique: true },
  password: { type: String},
  username: { type: String, required: true },
  institute: { type: String  },
  location: { type: String  },
  dateOfBirth:{ type: String  },
  contact: { type: String },
  socialMediaLinks: { type: String  },
  image: { type: String  },
  otp : {type:String }
});

const User = mongoose.model('User', userSchema);

module.exports = User;