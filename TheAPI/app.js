require("dotenv").config();

// Environment Variables Validation
if (!process.env.JWT_SECRET_KEY || !process.env.MONGOURI || !process.env.PORT) {
  console.error("Missing environment variables");
  process.exit(1);
}

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");

const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const uri = process.env.MONGOURI;

mongoose
  .connect(uri)
  .then(() => console.log("You successfully connected to MongoDB!"))
  .catch((err) => console.error("Connection error", err));

const app = express();
const httpServer = http.createServer(app);
const io = socketIo(httpServer, {
  // options...
});

const cors = require("cors");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
}

// io.on("connection", (socket) => {
//   console.log("a user connected");

//   socket.on("message", async (msg) => {
//     console.log("message: " + msg.content);

//     // Create a new message document
//     const message = new Message(msg);

//     // Save the message to the database
//     try {
//       await message.save();
//       // Emit the message to the receiver
//       socket.broadcast.to(msg.receiver).emit("message", msg);
//     } catch (err) {
//       console.error("Failed to save message: ", err);
//     }
//   });

//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//     // Update the user's online status in the database
//     // Add error handling here
//   });
// });

const port = process.env.PORT || 8000;
httpServer.listen(port, () => console.log(`Server is running on port ${port}`));

const User = require("./models/User");
const Message = require("./models/Message");
const bcrypt = require("bcrypt");
const saltRounds = 10;

// endpoint for registering a new user
app.post("/register", async (req, res) => {
  const { name, email, password, image } = req.body;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // create new User object
  const newUser = new User({ name, email, password: hashedPassword, image });

  // save user to database
  try {
    await newUser.save();
    res.status(200).json({ message: "Successfully registered user" });
  } catch (err) {
    console.log("Error registering user: ", err);
    res
      .status(500)
      .json({ message: `Failed to register the user: ${err.message}` });
  }
});

// function to create a token for a user
const createToken = (userId) => {
  // set the token payload
  const payload = {
    userId: userId,
  };

  // generate the token with a secret key and expiration time
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
    expiresIn: "1h",
  });
  return token;
};

// endpoint for logging in a user
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // check if the email and password are provided
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required!" });
  }

  // check if the user exists in the database
  User.findOne({ email })
    .then(async (user) => {
      if (!user) {
        // user not found
        return res.status(404).json({ message: "User not found!" });
      }

      // compare the provided password with the password in the database
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ message: "Incorrect password!" });
      }

      const token = createToken(user._id);
      res.status(200).json({ token, userId: user._id });
    })
    .catch((err) => {
      console.log("Error logging in user: ", err);
      res.status(500).json({ message: "Failed to login the user!" });
    });
});

// endpoint to access all the users except the logged in user

app.get("/users/:userId", authenticateJWT, async (req, res) => {
  const loggedInUserId = req.params.userId;

  User.find({ _id: { $ne: loggedInUserId } })
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((err) => {
      console.log("Error getting users: ", err);
      res.status(500).json({ message: "Failed to get users!" });
    });
});
