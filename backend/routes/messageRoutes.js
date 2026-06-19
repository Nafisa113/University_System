const express = require("express");

const Message = require("../models/Message");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const { asyncHandler, cleanText } = require("../utils/helpers");

const router = express.Router();

/* Send a Message */
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const body        = cleanText(req.body.body);
    const recipientId = cleanText(req.body.recipientId);

    if (!body) {
      return res.status(400).json({ message: "Message body is required" });
    }
    if (!recipientId) {
      return res.status(400).json({ message: "Recipient is required" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }
    if (req.user.id === recipientId) {
      return res.status(400).json({ message: "You cannot message yourself" });
    }

    const message = await Message.create({
      sender:    req.user.id,
      recipient: recipientId,
      body
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: message
    });
  })
);

/* Get conversation between logged-in user and one other user */
router.get(
  "/conversation/:userId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const otherId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: otherId },
        { sender: otherId,     recipient: req.user.id }
      ]
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { sender: otherId, recipient: req.user.id, readAt: null },
      { readAt: new Date() }
    );

    res.json(messages);
  })
);

/* Get inbox — all unique conversations */
router.get(
  "/inbox",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const messages = await Message.find({
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ]
    })
      .sort({ createdAt: -1 })
      .populate("sender",    "name profileImage role")
      .populate("recipient", "name profileImage role");

    const seen = new Map();

    messages.forEach(msg => {
      const other   = msg.sender._id.toString() === req.user.id ? msg.recipient : msg.sender;
      const otherId = other._id.toString();

      if (!seen.has(otherId)) {
        seen.set(otherId, {
          user:        other,
          lastMessage: msg.body,
          lastDate:    msg.createdAt,
          unread:      (msg.recipient._id.toString() === req.user.id && !msg.readAt) ? 1 : 0
        });
      } else if (msg.recipient._id.toString() === req.user.id && !msg.readAt) {
        seen.get(otherId).unread += 1;
      }
    });

    res.json(Array.from(seen.values()));
  })
);

module.exports = router;