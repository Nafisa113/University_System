const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 150
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: 100
    },

    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      maxlength: 100
    },

    semester: {
      type: String,
      required: [true, "Semester is required"],
      trim: true,
      maxlength: 50
    },

    filePath: {
      type: String,
      required: [true, "File path is required"]
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved"
    },

    downloadCount: {
      type: Number,
      default: 0
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

noteSchema.index({
  title: "text",
  subject: "text",
  department: "text",
  semester: "text"
});

module.exports = mongoose.model("Note", noteSchema);