const express = require("express");

const SemesterRecord = require("../models/SemesterRecord");
const authMiddleware = require("../middleware/authMiddleware");
const { asyncHandler, cleanText } = require("../utils/helpers");

const router = express.Router();

/* Get all semesters for logged-in student */
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const records = await SemesterRecord.find({ student: req.user.id })
      .sort({ createdAt: 1 });
    res.json(records);
  })
);

/* Save a new semester */
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const label   = cleanText(req.body.label);
    const gpa     = parseFloat(req.body.gpa);
    const credits = parseInt(req.body.credits);
    const courses = Array.isArray(req.body.courses) ? req.body.courses : [];

    if (!label || isNaN(gpa) || isNaN(credits)) {
      return res.status(400).json({
        message: "Label, GPA and credits are required"
      });
    }

    const record = await SemesterRecord.create({
      student: req.user.id,
      label,
      gpa,
      credits,
      courses
    });

    res.status(201).json({
      message: "Semester saved successfully",
      record
    });
  })
);

/* Update semester label */
router.put(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const record = await SemesterRecord.findOne({
      _id:     req.params.id,
      student: req.user.id
    });

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    const label = cleanText(req.body.label);
    if (label) record.label = label;

    await record.save();

    res.json({
      message: "Semester updated successfully",
      record
    });
  })
);

/* Delete a semester */
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const record = await SemesterRecord.findOneAndDelete({
      _id:     req.params.id,
      student: req.user.id
    });

    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.json({ message: "Semester deleted successfully" });
  })
);

module.exports = router;