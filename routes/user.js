const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User")
const feedback = require("../models/Feedback");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
router.use(cookieParser());
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer and cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "codesaarthi", // Specify your folder name
    allowed_formats: ["jpg", "jpeg", "png", "webp"], // Specify allowed formats
    public_id: (req, file) => `article-${Date.now()}`, // Unique filename generation
  },
});

const parser = multer({ storage: storage });
router.post('/user', async (req, res) => {
  try { 
    
    // Check Authorization header for JWT token
    const authHeader = req.headers['authorization']; 
    const token = authHeader && authHeader.split(' ')[1];
 
    if (!token) {
      return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }

    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ status: 'error', message: 'Token verification failed' });
      }

      // Fetch user information based on decoded data (e.g., userId, email)
      const { userId } = decoded;
      console.log(userId);
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ status: 'error', message: 'User not found' });
      }
      // Return user data if successful
      res.status(200).json({ status: 'success', user });
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  console.log("Received data:", req.body);
  if (!name || !email || !password) {
    return res.json({
      status: "error",
      message: "Please fill the data Correctly.",
    });
  }

  try {
    const user = await User.findOne({ email });
    if (user) {
      return res.json({ status: "error", message: "User already exists" });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const formattedName = name.replace(/\s+/g, "_").toLowerCase();
    const randomNumber = Math.floor(Math.random() * 90) + 10;
    const username = `${formattedName}@${randomNumber}`;
    const newUser = new User({
      name,
      email,
      password: hashPassword,
      username: username,
    });
    const savedUser = await newUser.save().catch((error) => {
      console.error("Error saving user to database:", error);
      throw error;
    });
    const token = jwt.sign(
      { userId: savedUser._id, name: savedUser.name },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1y", // Token expiration time
      }
    );

    // Set the token in a cookie
    res.cookie("token", token, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({
      status: "success",
      message: "Account created successfully.",
      token,
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: "error", message: "Account creation failed." });
  }
});
 
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.json({
      status: "error",
      message: "Please fill the data Correctly.",
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ status: "error", message: "Account does not exist." });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ status: "error", message: "Invalid password." });
    }
    const token = jwt.sign(
      {userId: user._id ,  name: user.name },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "1y",
      }
    );
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });
    return res.json({
      status: "success",
      message: "Login  successfully.", 
      token,
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: "error", message: "Login failed." });
  }
});

router.post("/logout", async (req, res) => {
  try {
    res.clearCookie('token', { path: '/' });
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
} catch (error) {
    res.status(500).json({ status: 'error', message: 'Logout failed' });
}
});

router.post("/saveuserData", async (req, res) => {
  const { email ,name ,username, image} = req.body; 

  try {
    const existingUser = await User.findOne({ email });

    // Create JWT token function
    const createToken = (user) => {
      return jwt.sign(
        { userId: user._id, name: user.name },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1y" }
      );
    };

    if (existingUser) {
      const token = createToken(existingUser);

      // Set the token in a cookie
      res.cookie("token", token, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });

      return res.json({
        status: "success",
        message: "Login successful.", 
        token,
      });
    } else {
      // Generate username from email 
    const randomNumber = Math.floor(Math.random() * 90) + 10;
    const usernameDB = `${username}@${randomNumber}`;

      const newUser = new User({
        name: name,
        email: email,
        username: usernameDB,
        image: image,
      });

      const savedUser = await newUser.save();
      if (savedUser) {
        const token = createToken(savedUser);

        // Set the token in a cookie
        res.cookie("token", token, {
          maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        });

        return res.json({
          status: "success",
          message: "Account created  successfully.", 
          token,
        });
      } else {
        return res.json({ status: "error", message: "Login Failed." });
      }
    }
  } catch (error) {
    console.error("Error saving user data:", error);
    return res.json({ status: "error", message: "Internal Server Error" });
  }
});


router.post("/contactemail", async (req, res) => { 
  const { name, email, message } = req.body;
  if(!name || !email || !message) {
    return res.json({ status: "error", message: "Incomplete data provided." });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.email_ID_CODE,
      pass: process.env.emailPassword,
    },
  }); 
   
  const savedFeedback = await feedback.create({
    name: name,
    email: email,
    message: message,
  });

  const mailOptions = {
    from: "Connect@codesaarthi.com",
    to: `${email}`,
    subject: "Thank you for your feedback",
    text: `${name}`,
    html: `<p><b>Dear ${name},</b></p>
    <p>We apologize for any inconvenience you may have faced on our website. Your feedback is valuable to us, and we assure you that we are working to resolve the issue as soon as possible.</p>
    <p>Thank you for bringing this to our attention, and we appreciate your patience.</p>
    <p>Best regards,<br>Your Codesaarthi Team</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    if(info){
      savedFeedback;
      console.log("Email sent:", info.response);
      return res.json({ status: "success", message: "Email sent successfully." });
    }else{
      console.log("Failed to deliver teh mail:", info.response);
      return res.json({ status: "error", message: "Failed to Deliver Mail ." });
    } 
  } catch (error) {
    console.error("Error sending email:", error.message);
    return res.json({ status: "error", message: "Internal Server Error" });
  }
});

const generateNumericOTP = (length) => {
  const numericChars = "0123456789";
  let otp = "";

  while (otp.length < length) {
    const randomUuid = uuidv4();
    const numericOnly = randomUuid.replace(/[^0-9]/g, "");
    otp += numericOnly;

    if (otp.length > length) {
      otp = otp.slice(0, length);
    }
  }

  return otp;
};

router.post("/sendemail", async (req, res) => {
  
  const { email } = req.body; 
  // Validate email input
  if (!email) {
    return res.status(400).json({
      status: "error",
      message: "Email is required.",
    });
  }

  const otp = generateNumericOTP(4);
  console.log(`Your email is ${email}`);
  console.log(`Your OTP is ${otp}`);

  try {
    const isValidUser = await User.findOne({ email: email });

    if (!isValidUser) {
      return res.status(404).json({ status: "error", message: "User not found." });
    }

    const filter = { email: email };
    const update = { otp: otp };
    const options = {
      new: true,
      upsert: true,
    };

    const updatedUser = await User.findOneAndUpdate(filter, update, options);

    if (!updatedUser) {
      return res.status(500).json({ status: "error", message: "Failed to update user with OTP." });
    }

    console.log("Data saved");

    // Configure nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.email_ID_CODE,
        pass: process.env.emailPassword,
      },
    });

    const mailOptions = {
      from: "Connect@codesaarthi.com",
      to: email,
      subject: "OTP for Verification",
      text: `Your OTP for verification is: ${otp}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);

    return res.status(200).json({status: "success", message: "OTP sent successfully.", });

  } catch (error) {
    console.error("Error sending OTP email:", error.message);
    return res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});

router.post("/verifyOtp", async (req, res) => {
  const { otp } = req.body; 
  const {email } = req.body; 
  console.log( req.body);
  console.log(otp);
  if (!email || !otp) {
    return res.json({ status: "error", message: "Please fill the otp." });
  } else {
    console.log(email);
    const otpCheck = await User.findOne({email});
    console.log( otpCheck);
    if (otpCheck) { 
      if (otpCheck.otp == otp) {
        return res.json({ status: "success", message: "OTP verified successfully."});
      } else {
        return res.json({ status: "error", message: "OTP not verified." });
      }
    } else {
      return res.json({
        status: "error",
        message: " User does not exist , Please register.",
      });
    }
  }
});

router.post("/updatePassword", async (req, res) => {
  const { password, email } = req.body;
  console.log(password);
  if (!password || !email) {
    return res.json({ status: "error", message: "Please fill the password." });
  }
  try {
    hashedPssword = await bcrypt.hash(password, 10);
    const user = await User.findOneAndUpdate(
      { email },
      { password : hashedPssword},
      { new: true }
    );

    if (!user) {
      return res.json({ status: "error", message: "User not found." });
    } 
    return res.json({ status: "success",  message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error.message);
    return res.json({ status: "error", message: "Internal Server Error" });
  }
});

router.post("/getUserData", async (req, res) => {
  try {
    const { email } = req.body;
    const userData = await User.findOne({ email });
    if (userData) {
      return res.json({ status: "success", data: userData });
    } else {
      return res.json({ status: "error", message: "User not found" });
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    res.json({ status: "error", error: "Failed to get user data" });
  }
});

router.post('/updateProfile', parser.single('image'), async (req, res) => {
  const { _id, name,  institute, location, dateOfBirth, contact, socialMediaLinks } = req.body;
  const image = req.file ? req.file.path : null;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name; 
    user.institute = institute || user.institute;
    user.location = location || user.location;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;
    user.contact = contact || user.contact;
    user.socialMediaLinks = socialMediaLinks || user.socialMediaLinks;
    if (image) user.image = image;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

router.delete("/delete/:id", async (req, res) => {
  console.log(req.params.id);
  console.log("deleted profile section ");
  try {
    const deleteUser = await User.findByIdAndDelete(req.params.id);

    if (!deleteUser) {
      return res.status(404).json({ message: "User not found" });
    } else {
      console.log("user deleted successfully");
      return res.status(200).json({ message: "User deleted successfully" });
    }
  } catch (err) {
    console.error("Failed to delete User:", err.message);
    return res.status(500).json({ message: "Failed to delete User" });
  }
});


module.exports = router;
