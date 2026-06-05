const mongoose = require("mongoose");

const supportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    type: {
      type: String,
      required: true,
      trim: true
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },

    status: {
      type: String,
      enum: ["open", "in-progress", "resolved"],
      default: "open"
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Support", supportSchema);