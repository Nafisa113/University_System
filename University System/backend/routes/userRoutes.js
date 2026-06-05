const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Note = require("../models/Note");
const PYQ = require("../models/PYQ");
const Announcement = require("../models/Announcement");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const profileUpload = require("../middleware/profileUpload");
const {
  asyncHandler,
  cleanText,
  getPagination,
  deleteUploadedFile,
  toUploadPath
} = require("../utils/helpers");

const router = express.Router();

function publicUser(user) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    batch: user.batch,
    semester: user.semester,
    studentId: user.studentId,
    phone: user.phone,
    address: user.address,
    profileImage: user.profileImage,
    status: user.status,
    createdAt: user.createdAt
  };
}

router.get(
  "/profile",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select(
      "-password -resetPasswordToken -resetPasswordCode -resetPasswordExpires"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  })
);

router.put(
  "/profile",
  authMiddleware,
  profileUpload.single("profileImage"),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const fields = ["name", "department", "batch", "semester", "studentId", "phone", "address"];

    fields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        user[field] = cleanText(req.body[field]);
      }
    });

    if (!user.name) {
      return res.status(400).json({ message: "Name is required" });
    }

    if (req.file) {
      if (user.profileImage) deleteUploadedFile(user.profileImage);
      user.profileImage = toUploadPath(req.file);
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: publicUser(user)
    });
  })
);

router.get(
  "/my-uploads",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const [notes, pyq] = await Promise.all([
      Note.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 }),
      PYQ.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 })
    ]);

    res.json({ notes, pyq });
  })
);

router.get(
  "/notifications",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const [announcements, recentNotes, recentPYQ] = await Promise.all([
      Announcement.find().sort({ createdAt: -1 }).limit(5),
      Note.find({ uploadedBy: req.user.id }).sort({ updatedAt: -1 }).limit(5),
      PYQ.find({ uploadedBy: req.user.id }).sort({ updatedAt: -1 }).limit(5)
    ]);

    const uploadNotifications = [
      ...recentNotes.map(item => ({
        type: "note",
        title: item.title,
        message: `Your note is ${item.status}`,
        status: item.status,
        createdAt: item.updatedAt || item.createdAt
      })),
      ...recentPYQ.map(item => ({
        type: "pyq",
        title: item.title,
        message: `Your PYQ is ${item.status}`,
        status: item.status,
        createdAt: item.updatedAt || item.createdAt
      }))
    ];

    const noticeNotifications = announcements.map(item => ({
      type: "announcement",
      title: item.title,
      message: item.message || item.description || "New announcement published",
      status: "info",
      createdAt: item.createdAt
    }));

    res.json(
      [...uploadNotifications, ...noticeNotifications]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 10)
    );
  })
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const filter = {};

    if (req.query.role) {
      filter.role = req.query.role;
    }

    if (req.query.search) {
      const search = req.query.search;
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { batch: { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } }
      ];
    }

    const { page, limit, skip } = getPagination(req.query);

    const query = User.find(filter)
      .select("-password -resetPasswordToken -resetPasswordCode -resetPasswordExpires")
      .sort({ createdAt: -1 });

    if (!limit) {
      const users = await query;
      return res.json(users);
    }

    const [items, total] = await Promise.all([
      query.skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  })
);

router.post(
  "/admin",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const name = cleanText(req.body.name);
    const email = cleanText(req.body.email).toLowerCase();
    const password = String(req.body.password || "");

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const exists = await User.findOne({ email });

    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = await User.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      role: "admin"
    });

    res.status(201).json({
      message: "Admin created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  })
);

router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!["active", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid user status" });
    }

    if (req.params.id === req.user.id && status === "blocked") {
      return res.status(400).json({ message: "You cannot block your own account" });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select(
      "-password -resetPasswordToken -resetPasswordCode -resetPasswordExpires"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: `User ${status} successfully`, user });
  })
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  })
);

router.post(
  "/bookmarks",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { resourceType, resourceId } = req.body;

    if (!["notes", "pyq"].includes(resourceType) || !resourceId) {
      return res.status(400).json({ message: "Valid resource type and resource ID are required" });
    }

    const Model = resourceType === "notes" ? Note : PYQ;
    const resource = await Model.findById(resourceId);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const user = await User.findById(req.user.id);
    const exists = user.bookmarks.some(
      item => item.resourceType === resourceType && item.resourceId.toString() === resourceId
    );

    if (!exists) {
      user.bookmarks.push({ resourceType, resourceId });
      await user.save();
    }

    res.json({ message: "Bookmark saved successfully", bookmarks: user.bookmarks });
  })
);

router.delete(
  "/bookmarks/:resourceType/:resourceId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    user.bookmarks = user.bookmarks.filter(
      item => !(item.resourceType === req.params.resourceType && item.resourceId.toString() === req.params.resourceId)
    );

    await user.save();

    res.json({ message: "Bookmark removed successfully", bookmarks: user.bookmarks });
  })
);

module.exports = router;