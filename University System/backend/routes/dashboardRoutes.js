const express = require("express");

const User = require("../models/User");
const Note = require("../models/Note");
const PYQ = require("../models/PYQ");
const Feedback = require("../models/Feedback");
const Announcement = require("../models/Announcement");
const Support = require("../models/Support");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { asyncHandler } = require("../utils/helpers");

const router = express.Router();

router.get(
  "/admin-stats",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const [
      totalStudents,
      totalAdmins,
      totalNotes,
      totalPYQ,
      totalFeedback,
      totalAnnouncements,
      pendingNotes,
      pendingPYQ,
      supportOpen
    ] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "admin" }),
      Note.countDocuments(),
      PYQ.countDocuments(),
      Feedback.countDocuments(),
      Announcement.countDocuments(),
      Note.countDocuments({ status: "pending" }),
      PYQ.countDocuments({ status: "pending" }),
      Support.countDocuments({ status: "open" })
    ]);

    res.json({
      totalStudents,
      totalAdmins,
      totalNotes,
      totalPYQ,
      totalFeedback,
      totalAnnouncements,
      pendingNotes,
      pendingPYQ,
      supportOpen
    });
  })
);

router.get(
  "/student-stats",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const [totalNotes, totalPYQ, myNotes, myPYQ, pendingUploads, approvedUploads, unreadAnnouncements] =
      await Promise.all([
        Note.countDocuments({ status: "approved" }),
        PYQ.countDocuments({ status: "approved" }),
        Note.countDocuments({ uploadedBy: req.user.id }),
        PYQ.countDocuments({ uploadedBy: req.user.id }),
        Promise.all([
          Note.countDocuments({ uploadedBy: req.user.id, status: "pending" }),
          PYQ.countDocuments({ uploadedBy: req.user.id, status: "pending" })
        ]).then(([notes, pyq]) => notes + pyq),
        Promise.all([
          Note.countDocuments({ uploadedBy: req.user.id, status: "approved" }),
          PYQ.countDocuments({ uploadedBy: req.user.id, status: "approved" })
        ]).then(([notes, pyq]) => notes + pyq),
        Announcement.countDocuments()
      ]);

    res.json({
      totalNotes,
      totalPYQ,
      myUploads: myNotes + myPYQ,
      pendingUploads,
      approvedUploads,
      unreadAnnouncements
    });
  })
);

router.get(
  "/recent",
  asyncHandler(async (req, res) => {
    const [recentNotes, recentPYQ, recentAnnouncements, recentUsers, recentSupport] =
      await Promise.all([
        Note.find().sort({ createdAt: -1 }).limit(5),
        PYQ.find().sort({ createdAt: -1 }).limit(5),
        Announcement.find().sort({ createdAt: -1 }).limit(5),
        User.find().select("name email role department batch createdAt").sort({ createdAt: -1 }).limit(5),
        Support.find().sort({ createdAt: -1 }).limit(5)
      ]);

    res.json({
      recentNotes,
      recentPYQ,
      recentPyq: recentPYQ,
      recentAnnouncements,
      recentUsers,
      recentSupport
    });
  })
);

module.exports = router;