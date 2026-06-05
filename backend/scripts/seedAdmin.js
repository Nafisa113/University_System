const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env")
});

const User = require("../models/User");

async function seedAdmin() {
  try {
    console.log("Starting admin seed...");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing in backend/.env file");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    const name = process.env.ADMIN_NAME || "System Admin";
    const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "Admin@12345";

    const hashedPassword = await bcrypt.hash(password, 12);

    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
      existingAdmin.name = name;
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "admin";
      existingAdmin.status = "active";

      await existingAdmin.save();

      console.log("Admin updated successfully");
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);

      await mongoose.disconnect();
      process.exit(0);
    }

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
      status: "active"
    });

    console.log("Admin created successfully");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed admin error:", error.message);
    process.exit(1);
  }
}

seedAdmin();