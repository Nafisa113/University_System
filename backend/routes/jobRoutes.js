const express = require("express");

const Job = require("../models/Job");
const authMiddleware = require("../middleware/authMiddleware");
const alumniMiddleware = require("../middleware/alumniMiddleware");
const { asyncHandler, cleanText, getPagination } = require("../utils/helpers");

const router = express.Router();

/* =========================
   Alumni: Post a New Job
========================= */
router.post(
  "/",
  authMiddleware,
  alumniMiddleware,
  asyncHandler(async (req, res) => {
    const title       = cleanText(req.body.title);
    const company     = cleanText(req.body.company);
    const description = cleanText(req.body.description);
    const jobType     = cleanText(req.body.jobType || "full-time");
    const location    = cleanText(req.body.location || "");
    const applyLink   = cleanText(req.body.applyLink || "");
    const deadline    = req.body.deadline ? new Date(req.body.deadline) : null;

    if (!title || !company || !description) {
      return res.status(400).json({
        message: "Title, company and description are required"
      });
    }

    const allowedTypes = ["full-time", "part-time", "internship", "remote", "contract"];

    const job = await Job.create({
      title,
      company,
      description,
      jobType: allowedTypes.includes(jobType) ? jobType : "full-time",
      location,
      applyLink,
      deadline,
      postedBy: req.user.id
    });

    res.status(201).json({
      message: "Job posted successfully",
      job
    });
  })
);

/* =========================
   Public: Get All Open Jobs
========================= */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);

    const filter = { status: "open" };

    if (req.query.jobType) {
      filter.jobType = cleanText(req.query.jobType);
    }

    if (!limit) {
      const jobs = await Job.find(filter)
        .sort({ createdAt: -1 })
        .populate("postedBy", "name email department currentCompany designation linkedinProfile profileImage");

      return res.json(jobs);
    }

    const [items, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("postedBy", "name email department currentCompany designation linkedinProfile profileImage"),
      Job.countDocuments(filter)
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

/* =========================
   Alumni: Get My Posted Jobs
========================= */
router.get(
  "/my-jobs",
  authMiddleware,
  alumniMiddleware,
  asyncHandler(async (req, res) => {
    const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(jobs);
  })
);

/* =========================
   Alumni / Admin: Update a Job
========================= */
router.put(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const isOwner = job.postedBy.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to update this job"
      });
    }

    const title       = cleanText(req.body.title);
    const company     = cleanText(req.body.company);
    const description = cleanText(req.body.description);
    const jobType     = cleanText(req.body.jobType || "");
    const location    = cleanText(req.body.location || "");
    const applyLink   = cleanText(req.body.applyLink || "");
    const status      = cleanText(req.body.status || "");
    const allowedTypes = ["full-time", "part-time", "internship", "remote", "contract"];

    if (title) job.title = title;
    if (company) job.company = company;
    if (description) job.description = description;
    if (allowedTypes.includes(jobType)) job.jobType = jobType;
    job.location = location;
    job.applyLink = applyLink;
    if (req.body.deadline) job.deadline = new Date(req.body.deadline);
    if (["open", "closed"].includes(status)) job.status = status;

    await job.save();

    res.json({
      message: "Job updated successfully",
      job
    });
  })
);

/* =========================
   Alumni / Admin: Delete a Job
========================= */
router.delete(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const isOwner = job.postedBy.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You are not authorized to delete this job"
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({ message: "Job deleted successfully" });
  })
);

module.exports = router;