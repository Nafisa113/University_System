function errorMiddleware(error, req, res, next) {
  console.error("ERROR:", error);

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format"
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      message: "Duplicate value already exists"
    });
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map(item => item.message);
    return res.status(400).json({
      message: messages[0] || "Validation error"
    });
  }

  if (error.message && error.message.includes("Only PDF")) {
    return res.status(400).json({
      message: error.message
    });
  }

  res.status(error.statusCode || 500).json({
    message: error.message || "Server error"
  });
}

module.exports = errorMiddleware;