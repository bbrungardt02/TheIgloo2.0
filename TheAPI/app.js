require("dotenv").config();

// Environment Variables Validation
if (!process.env.JWT_SECRET_KEY || !process.env.MONGOURI || !process.env.PORT) {
  console.error("Missing environment variables");
  process.exit(1);
}

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const socketIo = require("socket.io");

const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const uri = process.env.MONGOURI;

mongoose
  .connect(uri)
  .then(() => console.log("You successfully connected to MongoDB!"))
  .catch((err) => console.error("Connection error", err));

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const cors = require("cors");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`Listening on port ${port}`));

const User = require("./models/User");
const Message = require("./models/Message");
const Conversation = require("./models/Conversation");

const bcrypt = require("bcrypt");
const saltRounds = 10;

function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    return new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    })
      .then((user) => {
        req.user = user;
        next();
      })
      .catch((err) => {
        console.log(err);
        res.sendStatus(403);
      });
  } else {
    res.sendStatus(401);
  }
}

// Socket.io code for real-time chat

const users = {};

io.on("connection", (socket) => {
  console.log("a user connected");

  const userId = socket.handshake.query.userId;
  if (userId) {
    socket.join(userId);
    if (!users[userId]) {
      users[userId] = { id: userId, count: 1 };
    } else {
      users[userId].count++;
    }
    socket.emit("userOnline", userId);
  }

  socket.on("joinConversation", (conversationId) => {
    if (conversationId) {
      // Check if the socket is already in the room
      const rooms = Object.keys(socket.rooms);
      if (rooms.includes(conversationId)) {
        console.log(
          `Socket is already in conversation with ID: ${conversationId}`
        );
        return;
      }

      socket.join(conversationId, (error) => {
        if (error) {
          console.error(
            `Failed to join conversation with ID: ${conversationId}. Error: ${error}`
          );
        } else {
          console.log(`Socket joined conversation with ID: ${conversationId}`);
        }
      });
    } else {
      console.error("No conversationId provided for joinConversation event");
    }
  });

  socket.on("message", async (message) => {
    try {
      const { conversationId, userId, text } = message;

      let images = [];
      let videos = [];
      let audios = [];

      const newMessage = new Message({
        conversationId: conversationId,
        userId: userId,
        text: text,
        timestamp: new Date(),
        images,
        videos,
        audios,
        read: false,
      });

      await newMessage.save();

      await Conversation.findByIdAndUpdate(conversationId, {
        $push: { messages: newMessage._id },
        lastMessage: newMessage._id,
      });

      // Populate the userId field of the newMessage document with only the name and _id fields
      await newMessage.populate({
        path: "userId",
        model: "User",
        select: "name _id", // Only include the name and _id fields
      });

      io.to(conversationId).emit("message", newMessage);

      console.log("message", newMessage);
      console.log("conversationId", conversationId);
    } catch (error) {
      console.log("Error sending message: ", error);
    }
  });

  socket.on("createChat", (data) => {
    // Emit the newChat event to the conversation room
    io.to(data.conversationId).emit("newChat", data);
  });

  socket.on("isRecipientOnline", (recipientId) => {
    io.to(userId).emit("isRecipientOnline", !!users[recipientId]);
  });

  socket.on("offline", (userId) => {
    if (users[userId]) {
      users[userId].count--;
      if (users[userId].count === 0) {
        delete users[userId];
      }
    }
    io.emit("userOffline", userId);
  });

  socket.on("online", (userId) => {
    if (!users[userId]) {
      users[userId] = { id: userId, count: 1 };
    } else {
      users[userId].count++;
    }
    io.emit("userOnline", userId);
  });

  socket.on("userTyping", (status) => {
    socket.broadcast.to(conversationId).emit("userTyping", status);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    if (users[userId]) {
      users[userId].count--;
      if (users[userId].count === 0) {
        delete users[userId];
      }
    }
  });
});

// endpoint to delete all messages in conversation

app.delete("/messages/:conversationId", authenticateJWT, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await Message.deleteMany({ conversationId: conversationId });
    res.status(200).json({ message: "Messages deleted successfully!" });
  } catch (error) {
    console.log("Error deleting messages: ", error);
    res.status(500).json({ message: "Failed to delete messages!" });
  }
});

// endpoint to access all the users for testing purposes
app.get("/users", async (req, res) => {
  User.find()
    .select("name") // find all the users and select only the 'name' field
    .then((users) => {
      res.json(users);
    })
    .catch((err) => {
      console.log("Error getting users: ", err);
      res.status(500).json({ message: "Failed to get users!" });
    });
});

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
    expiresIn: "7d",
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

// endpoint to access all the users except the logged in user and current friends
// REMEMBER TO CHANGE TO AND CURRENT FRIENDS
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

// endpoint to send a request to a user

app.post("/friend-request", authenticateJWT, async (req, res) => {
  const { currentUserId, selectedUserId } = req.body;

  try {
    // update the recipient's friendRequests array
    await User.findByIdAndUpdate(
      selectedUserId,
      {
        $push: {
          friendRequests: currentUserId,
        },
      },
      { new: true }
    );
    // update the sender's sentFriendRequests array
    await User.findByIdAndUpdate(
      currentUserId,
      {
        $push: {
          sentFriendRequests: selectedUserId,
        },
      },
      { new: true }
    );

    res.status(200).json({ message: "Request sent successfully!" });
  } catch (err) {
    console.log("Error sending request: ", err);
    res.status(500).json({ message: "Failed to send request!" });
  }
});

// endpoint to show all the friend requests received of a particular user

app.get("/friend-requests/:userId", authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;

    // fetch the user document based on the UserId
    const user = await User.findById(userId)
      .populate("friendRequests", "name email image")
      .lean();

    const friendRequests = user.friendRequests;
    res.json(friendRequests);
  } catch (error) {
    console.log("Error getting friend requests: ", error);
    res.status(500).json({ message: "Failed to get friend requests!" });
  }
});

// endpoint to show all the friend requests sent of a particular user

app.get("/sent-friend-requests/:userId", authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;

    // fetch the user document based on the UserId
    const user = await User.findById(userId)
      .populate("sentFriendRequests", "name email image")
      .lean();

    const sentFriendRequests = user.sentFriendRequests;
    res.json(sentFriendRequests);
  } catch (error) {
    console.log("Error getting sent friend requests: ", error);
    res.status(500).json({ message: "Failed to get sent friend requests!" });
  }
});

// endpoint to accept a friend request

app.post("/friend-request/accept", authenticateJWT, async (req, res) => {
  try {
    const { senderId, recipientId } = req.body;

    // retrieve the documents of sender and the recipient
    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);

    // update the friends list for both users
    sender.friends.push(recipientId);
    recipient.friends.push(senderId);

    recipient.friendRequests = recipient.friendRequests.filter(
      (request) => request.toString() !== senderId.toString()
    );

    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      (request) => request.toString() !== recipientId.toString()
    );

    await sender.save();
    await recipient.save();

    res.status(200).json({ message: "Friend request accepted successfully!" });
  } catch (error) {
    console.log("Error accepting friend request: ", error);
    res.status(500).json({ message: "Failed to accept request!" });
  }
});

// endpoint to reject a friend request

// endpoint to access all the friends of the logged in user

app.get("/friends/:userId", authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate("friends", "name email image")
      .lean();

    const friends = user.friends;
    res.json(friends);
  } catch (error) {
    console.log("Error getting friends: ", error);
    res.status(500).json({ message: "Failed to get friends!" });
  }
});

// endpoint to create a new chat room in the conversation collection

app.post("/conversation", authenticateJWT, async (req, res) => {
  try {
    const { senderId, recipientIds } = req.body; // recipientIds should be an array

    // create a new conversation with all participants
    const newConversation = new Conversation({
      participants: [senderId, ...recipientIds],
    });

    io.emit("new conversation", { conversationId: newConversation._id });
    await newConversation.save();
    res.status(200).json({ conversation: newConversation });
  } catch (error) {
    console.log("Error creating conversation: ", error);
    res.status(500).json({ message: "Failed to create conversation!" });
  }
});

// endpoint to get all the conversations of a particular user

app.get("/conversations/:userId", authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;

    // fetch the conversations of the user
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "name email image")
      .populate("messages", "text timestamp")
      .lean();

    res.json(conversations);
  } catch (error) {
    console.log("Error getting conversations: ", error);
    res.status(500).json({ message: "Failed to get conversations!" });
  }
});

// endpoint to get the user details to design the chat room header

app.get("/user/:userId", authenticateJWT, async (req, res) => {
  try {
    const { userId } = req.params;

    // fetch the user data from the user ID
    const recipientId = await User.findById(userId);
    res.json(recipientId);
  } catch (error) {
    console.log("Error getting user details: ", error);
    res.status(500).json({ message: "Failed to get user details!" });
  }
});

// Configure multer for handling file uploads

const path = require("path");
const multer = require("multer");
const mime = require("mime-types");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public");
  },
  filename: function (req, file, cb) {
    const name = req.params.id;
    cb(null, name + (path.extname(file.originalname) || ".png"));
  },
});

const upload = multer({ storage });

function getRandomString(length = 20) {
  const randomChars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++)
    result += randomChars.charAt(
      Math.floor(Math.random() * randomChars.length)
    );
  return result;
}

// endpoint to fetch the messages of the conversation

app.get("/messages/:conversationId", authenticateJWT, async (req, res) => {
  try {
    // fetch the conversation and populate the messages
    const conversation = await Conversation.findById(
      req.params.conversationId
    ).populate({
      path: "messages",
      populate: {
        path: "userId",
        model: "User",
        select: "name _id", // Only include the name and _id fields
      },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json(conversation.messages);
  } catch (error) {
    console.log("Error getting messages: ", error);
    res
      .status(500)
      .json({ message: `Failed to get messages! Error: ${error.message}` });
  }
});
