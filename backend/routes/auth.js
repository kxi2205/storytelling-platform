const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log(`[${new Date().toISOString()}] Multer destination: public/uploads/profile_pics/ for file ${file.originalname}`);
    cb(null, "public/uploads/profile_pics/");
  },
  filename: function (req, file, cb) {
    const newFilename = Date.now() + path.extname(file.originalname);
    console.log(`[${new Date().toISOString()}] Multer filename: ${newFilename} for original file ${file.originalname}`);
    cb(null, newFilename);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
});

// ==============================
// User Signup
// ==============================

router.post("/signup", 
  (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Received POST request for /signup`);
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    if (req.headers['content-type'] && !req.headers['content-type'].includes('multipart/form-data')) {
      console.log("Request body (pre-multer):", JSON.stringify(req.body, null, 2));
    }
    next();
  },
  (req, res, next) => {
    const multerUpload = upload.single("profilePic");
    multerUpload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        console.error("MulterError during profile pic upload:", err);
        return res.status(500).json({ error: "File upload error: " + err.message });
      } else if (err) {
        console.error("Unknown error during profile pic upload:", err);
        return res.status(500).json({ error: "File upload error: " + err.message });
      }
      console.log(`[${new Date().toISOString()}] Multer processing complete for /signup. File: ${req.file ? req.file.filename : 'No file uploaded'}`);
      next();
    });
  },
  async (req, res) => {
    console.log(`[${new Date().toISOString()}] Post-multer processing for /signup`);
    console.log("Request body (post-multer):", JSON.stringify(req.body, null, 2));
    if (req.file) {
      console.log("File uploaded:", JSON.stringify(req.file, null, 2));
    } else {
      console.log("No file uploaded.");
    }

    const { name, username, password, role } = req.body;
    let profilePicPath = req.file ? `/uploads/profile_pics/${req.file.filename}` : undefined;

    try {
      console.log("Attempting to find existing user:", username);
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        console.log("User already exists:", username);
        return res.status(400).json({ error: "Username already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        username,
        password: hashedPassword,
        role: role || "Writer",
        profilePic: profilePicPath,
      });

      await user.save();
      console.log("User saved successfully:", username);
      res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
      console.error("Signup Error in catch block:", error);
      res.status(500).json({ error: "Server error from catch block" });
    }
  }
);

// ==============================
// User Login (Updated)
// ==============================

router.post("/login", async (req, res) => {
  console.log("[LOGIN] Login request body:", req.body);
  const { username, password } = req.body;

  console.log("[LOGIN] Extracted username:", username);
  console.log("[LOGIN] Extracted password:", !!password ? "provided" : "missing");

  try {
    if (!username || !password) {
      console.warn("[LOGIN] Missing username or password");
      return res.status(400).json({ message: "Please provide both username and password" });
    }

    let user;
    try {
      console.log("🔍 Login attempt with username:", username);
      user = await User.findOne({ username });
    } catch (err) {
      console.error("[LOGIN] MongoDB query failed:", err);
      return res.status(500).json({ message: "Database query error" });
    }

    if (!user) {
      console.warn("[LOGIN] No user found with username:", username);
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn("[LOGIN] Password mismatch for user:", username);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user });
  } catch (error) {
    console.log("DEBUG: LOGIN_ROUTE_CATCH_BLOCK_ENTERED");
    console.error("Login server error:", error);
    res.status(500).json({ message: "INTERNAL_LOGIN_ERROR_AUTH_JS" });
  }
});

// ==============================
// Get Profile
// ==============================

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    console.log("📥 User ID from token:", req.user.id);
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Server error while fetching profile." });
  }
});

// ==============================
// Update Profile Picture
// ==============================

router.put("/profile/picture", authMiddleware, upload.single("profilePic"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Delete old profile picture if it exists
    if (user.profilePic) {
      const fs = require("fs");
      const oldPicPath = path.join(__dirname, "..", "public", user.profilePic);
      if (fs.existsSync(oldPicPath)) {
        fs.unlinkSync(oldPicPath);
      }
    }

    user.profilePic = `/uploads/profile_pics/${req.file.filename}`;
    await user.save();

    res.json({ message: "Profile picture updated successfully.", user });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ error: "Server error while updating profile picture." });
  }
});

module.exports = router;
