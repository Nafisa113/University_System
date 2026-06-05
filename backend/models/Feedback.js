const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, "Feedback message is required"],
      trim: true,
      maxlength: 2000
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);