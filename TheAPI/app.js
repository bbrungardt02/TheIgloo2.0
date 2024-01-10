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
    const { senderId, recipientId } = req.body;

    // check if a conversation already exists between the sender and the recipient
    const conversation = await Conversation.findOne({
      participants: [senderId, recipientId],
    });

    if (conversation) {
      return res.status(200).json({ conversation });
    }

    // create a new conversation
    const newConversation = new Conversation({
      participants: [senderId, recipientId],
    });

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

// endpoint to post messages and store it in the backend per conversation while keeping in mind socket.io

app.post(
  "/messages",
  authenticateJWT,
  upload.fields([
    { name: "imageFile", maxCount: 1 },
    { name: "videoFile", maxCount: 1 },
    { name: "audioFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        senderId,
        recipientId,
        messageType,
        messageText,
        conversationId,
      } = req.body;

      let images = [];
      let videos = [];
      let audios = [];

      if (messageType === "image") {
        if (!req.files.imageFile) {
          return res.status(400).json({ message: "No image file uploaded" });
        }
        images.push(req.files.imageFile[0].path);
      }

      if (messageType === "video") {
        if (!req.files.videoFile) {
          return res.status(400).json({ message: "No video file uploaded" });
        }
        videos.push(req.files.videoFile[0].path);
      }

      if (messageType === "audio") {
        if (!req.files.audioFile) {
          return res.status(400).json({ message: "No audio file uploaded" });
        }
        audios.push(req.files.audioFile[0].path);
      }

      const newMessage = new Message({
        conversationId,
        userId: senderId,
        text: messageText,
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

      io.to(conversationId).emit("chat", newMessage);

      res.status(200).json({ message: "Message sent successfully!" });
    } catch (error) {
      console.log("Error sending message: ", error);
      res.status(500).json({ message: "Failed to send message!" });
    }
  }
);

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

// endpoint to fetch the messages of the conversation

app.get("/messages/:conversationId", authenticateJWT, async (req, res) => {
  try {
    // fetch the messages of the conversation
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).populate("userId", "_id name");

    res.json(messages);
  } catch (error) {
    console.log("Error getting messages: ", error);
    res
      .status(500)
      .json({ message: `Failed to get messages! Error: ${error.message}` });
  }
});

// Socket.io code for real-time chat

const { Server } = require("socket.io");

module.exports = function (server) {
  const io = new Server(server);
  const users = {};

  io.on("connection", (socket) => {
    console.log("a user connected");

    const conversationId = socket.handshake.query.conversationId;
    const userId = socket.handshake.query.userId;
    if (conversationId) socket.join(conversationId);
    if (userId) {
      socket.join(userId);
      if (!users[userId]) {
        users[userId] = { id: userId, count: 1 };
      } else {
        users[userId].count++;
      }
      socket.emit("userOnline", userId);
    }

    socket.on("disconnect", () => {
      console.log("user disconnected");
      if (users[userId]) {
        users[userId].count--;
        if (users[userId].count === 0) {
          delete users[userId];
        }
      }
    });

    // Save the message to the database
    async function saveMessage(messageData) {
      const message = new Message(messageData.message);
      await message.save();
      return message;
    }

    // Update the conversation with the new message
    async function updateConversation(messageData, message) {
      await Conversation.findByIdAndUpdate(messageData.conversationId, {
        $push: { messages: message._id },
        lastMessage: message._id,
      });
    }

    socket.on("chat", async (messageData) => {
      try {
        const message = await saveMessage(messageData);
        await updateConversation(messageData, message);

        // Emit the chat event to the conversation room
        socket.broadcast.to(conversationId).emit("chat", messageData);
      } catch (error) {
        console.error(error);
        socket.emit("error", {
          message: "An error occurred while sending the message.",
        });
      }
    });

    socket.on("createChat", async (data) => {
      // Create a new conversation in the database
      const conversation = new Conversation({
        participants: data.users.map((u) => u._id),
      });
      await conversation.save();

      // Emit the newChat event to the recipient users
      const recipients = data.users.filter((x) => x._id !== userId);
      recipients.forEach((r) => io.to(r._id).emit("newChat", data));
    });

    socket.on("isRecipientOnline", (recipientId) => {
      io.to(userId).emit(
        "isRecipientOnline",
        !!Object.values(users).find((id) => id === recipientId)
      );
    });

    socket.on("offline", (userId) => {
      io.emit("userOffline", userId);
    });

    socket.on("online", (userId) => {
      io.emit("userOnline", userId);
    });

    socket.on("userTyping", (status) => {
      socket.broadcast.to(conversationId).emit("userTyping", status);
    });

    socket.on("disconnect", () => {
      console.log("user disconnected");
      delete users[socket.id];
    });
  });
};
