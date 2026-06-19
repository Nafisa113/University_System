const express = require("express");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const alumniMiddleware = require("../middleware/alumniMiddleware");
const { asyncHandler, cleanText } = require("../utils/helpers");

const router = express.Router();

/* =========================
   Public: List All Alumni
========================= */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = { role: "alumni" };

    if (req.query.department) {
      filter.department = {
        $regex: cleanText(req.query.department),
        $options: "i"
      };
    }

    const alumni = await User.find(filter)
      .select("name email department batch currentCompany designation linkedinProfile profileImage createdAt")
      .sort({ createdAt: -1 });

    res.json(alumni);
  })
);

/* =========================
   Alumni: Update Alumni Profile Fields
========================= */
router.put(
  "/profile",
  authMiddleware,
  alumniMiddleware,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.currentCompany  = cleanText(req.body.currentCompany  || "");
    user.designation     = cleanText(req.body.designation     || "");
    user.linkedinProfile = cleanText(req.body.linkedinProfile || "");

    await user.save();

    res.json({
      message: "Alumni profile updated successfully",
      user: {
        id:              user._id,
        name:            user.name,
        email:           user.email,
        role:            user.role,
        department:      user.department,
        batch:           user.batch,
        currentCompany:  user.currentCompany,
        designation:     user.designation,
        linkedinProfile: user.linkedinProfile,
        profileImage:    user.profileImage
      }
    });
  })
);

module.exports = router;