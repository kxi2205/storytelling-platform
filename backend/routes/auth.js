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
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
  // Adding error handling for multer directly
  // Note: This is a general way, specific error checks can be added in the route handler too.
});

// User Signup
router.post("/signup", (req, res, next) => {
    console.log(`[${new Date().toISOString()}] Received POST request for /signup`);
    console.log("Request headers:", JSON.stringify(req.headers, null, 2));
    // Log body before multer only if not multipart, otherwise multer consumes it
    if (req.headers['content-type'] && !req.headers['content-type'].includes('multipart/form-data')) {
        console.log("Request body (pre-multer):", JSON.stringify(req.body, null, 2));
    }
    next();
},
(req, res, next) => { // New Multer error handling middleware
    const multerUpload = upload.single("profilePic");
    multerUpload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error("MulterError during profile pic upload:", err);
            // You could customize the response, but for now, just pass the error
            return res.status(500).json({ error: "File upload error: " + err.message });
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error("Unknown error during profile pic upload:", err);
            return res.status(500).json({ error: "File upload error: " + err.message });
        }
        // Everything went fine with multer, proceed to the next handler
        console.log(`[${new Date().toISOString()}] Multer processing complete for /signup. File: ${req.file ? req.file.filename : 'No file uploaded'}`);
        next();
    });
},
async (req, res) => {
    console.log(`[${new Date().toISOString()}] Post-multer processing for /signup`);
    // Log body after multer has processed it
    console.log("Request body (post-multer):", JSON.stringify(req.body, null, 2));

    if (req.file) {
        console.log("File uploaded:", JSON.stringify(req.file, null, 2));
    } else {
        console.log("No file uploaded.");
    }

    const { name, username, password, role } = req.body;
    let profilePicPath;

    if (req.file) {
        profilePicPath = `/uploads/profile_pics/${req.file.filename}`;
    }

    try {
        console.log("Attempting to find existing user:", username);
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            console.log("User already exists:", username);
            return res.status(400).json({ error: "Username already taken" });
        }

        console.log("Attempting to hash password for user:", username);
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const userToCreate = {
            name,
            username,
            password: hashedPassword,
            role: role || "Writer",
            profilePic: profilePicPath,
        };
        console.log("Attempting to save new user:", JSON.stringify(userToCreate, null, 2));
        const user = new User(userToCreate);
        await user.save();
        console.log("User saved successfully:", username);

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Signup Error in catch block:", error);
        res.status(500).json({ error: "Server error from catch block" });
    }
});

// User Login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get Authenticated User Profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    console.log("📥 User ID from token:", req.user.id); // Debug
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update Profile Picture
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
			const path = require("path"); // Ensure path is required if not already
			const oldPicPath = path.join(__dirname, "..", "public", user.profilePic); // Adjusted path
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
