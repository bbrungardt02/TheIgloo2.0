const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  messageType: {
    type: String,
    enum: ["text", "image", "video", "audio"],
  },
  message: String,
  imageURL: String,
  timestamp: { type: Date, default: Date.now },
  read: Boolean,
});

const Message = mongoose.model("Message", MessageSchema);

module.exports = Message;
