const fs = require("fs");
const path = require("path");

function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function cleanText(value = "") {
  return String(value).trim();
}

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildResourceQuery(query) {
  const filter = {};

  if (query.search) {
    const search = escapeRegex(query.search);
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
      { semester: { $regex: search, $options: "i" } },
      { year: { $regex: search, $options: "i" } }
    ];
  }

  ["department", "semester", "subject", "year", "status"].forEach(field => {
    if (query[field]) {
      filter[field] = {
        $regex: escapeRegex(query[field]),
        $options: "i"
      };
    }
  });

  return filter;
}

function getPagination(query) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 0, 0), 50);
  const skip = limit ? (page - 1) * limit : 0;

  return { page, limit, skip };
}

function getSort(sort = "newest") {
  if (sort === "oldest") return { createdAt: 1 };
  if (sort === "title") return { title: 1 };
  if (sort === "downloads") return { downloadCount: -1 };
  return { createdAt: -1 };
}

function toUploadPath(file) {
  if (!file) return "";

  const uploadsRoot = path.join(__dirname, "..", "uploads");
  const relativePath = path.relative(uploadsRoot, file.path || "").replace(/\\/g, "/");

  return relativePath && !relativePath.startsWith("..")
    ? `/uploads/${relativePath}`
    : `/uploads/${file.filename}`;
}

function deleteUploadedFile(filePath) {
  if (!filePath) return;

  const cleanPath = String(filePath).replace(/\\/g, "/");
  const uploadIndex = cleanPath.lastIndexOf("/uploads/");
  const relativePath = uploadIndex >= 0
    ? cleanPath.slice(uploadIndex + "/uploads/".length)
    : path.basename(cleanPath);

  const fullPath = path.join(__dirname, "..", "uploads", relativePath);

  fs.unlink(fullPath, error => {
    if (error && error.code !== "ENOENT") {
      console.error("Failed to delete file:", error.message);
    }
  });
}

module.exports = {
  asyncHandler,
  cleanText,
  buildResourceQuery,
  getPagination,
  getSort,
  toUploadPath,
  deleteUploadedFile
};