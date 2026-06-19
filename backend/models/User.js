const mongoose = require("mongoose");

const bookmarkSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      enum: ["notes", "pyq"],
      required: true
    },

    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  { _id: false, timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: 80
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"]
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6
    },

    role: {
      type: String,
      enum: ["admin", "student", "alumni"],
      default: "student"
    },

    department: {
      type: String,
      default: "",
      trim: true
    },

    batch: {
      type: String,
      default: "",
      trim: true
    },

    semester: {
      type: String,
      default: "",
      trim: true
    },

    studentId: {
      type: String,
      default: "",
      trim: true
    },

    phone: {
      type: String,
      default: "",
      trim: true
    },

    address: {
      type: String,
      default: "",
      trim: true,
      maxlength: 250
    },

    profileImage: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["active", "blocked", "pending"],
      default: "pending"
    },

    bookmarks: {
      type: [bookmarkSchema],
      default: []
    },

    resetPasswordToken: {
      type: String,
      default: ""
    },

    resetPasswordCode: {
      type: String,
      default: ""
    },

    resetPasswordExpires: {
      type: Date
    },

    currentCompany: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100
    },

    designation: {
      type: String,
      default: "",
      trim: true,
      maxlength: 100
    },

    linkedinProfile: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
