const express = require("express");

const Announcement = require("../models/Announcement");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { asyncHandler, cleanText, getPagination } = require("../utils/helpers");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const title = cleanText(req.body.title);
    const description = cleanText(req.body.description || req.body.message);
    const priority = cleanText(req.body.priority || "normal");

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required"
      });
    }

    const announcement = await Announcement.create({
      title,
      description,
      priority: ["normal", "important", "urgent"].includes(priority) ? priority : "normal",
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Announcement added successfully",
      announcement
    });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);

    if (!limit) {
      const announcements = await Announcement.find().sort({ createdAt: -1 });
      return res.json(announcements);
    }

    const [items, total] = await Promise.all([
      Announcement.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Announcement.countDocuments()
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

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const title = cleanText(req.body.title);
    const description = cleanText(req.body.description || req.body.message);
    const priority = cleanText(req.body.priority || "normal");

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    if (title) announcement.title = title;
    if (description) announcement.description = description;
    if (["normal", "important", "urgent"].includes(priority)) {
      announcement.priority = priority;
    }

    await announcement.save();

    res.json({
      message: "Announcement updated successfully",
      announcement
    });
  })
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        message: "Announcement not found"
      });
    }

    res.json({
      message: "Announcement deleted successfully"
    });
  })
);

module.exports = router;