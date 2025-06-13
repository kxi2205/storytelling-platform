const express = require("express");
const Story = require("../models/Story");
const authMiddleware = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// Ensure upload directory exists
const coverUploadDir = path.join(__dirname, "..", "public", "uploads", "cover_pages");
if (!fs.existsSync(coverUploadDir)) {
  fs.mkdirSync(coverUploadDir, { recursive: true });
}

// Multer config for cover page
const coverStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, coverUploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});

const coverFileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
    req.fileValidationError = 'Only JPG, JPEG, PNG image files are allowed!';
    return cb(new Error('Only JPG, JPEG, PNG image files are allowed!'), false);
  }
  cb(null, true);
};

const uploadCover = multer({ storage: coverStorage, fileFilter: coverFileFilter, limits: { fileSize: 1024 * 1024 * 5 } }); // 5MB limit

// Create a new story
router.post("/create", authMiddleware, async (req, res) => {
  const { title, genre, description } = req.body; // genre and description are now optional
  const author = req.user.id; // From authMiddleware

  try {
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    // coverPageUrl, characters, and chapters will default to empty or schema defaults
    const newStory = new Story({
      title,
      author,
      genre: genre || undefined, // Set to undefined if not provided, so mongoose defaults apply if any
      description: description || undefined, // Set to undefined if not provided
      // characters: [], // Defaulted by schema
      // chapters: [], // Defaulted by schema
      // coverPageUrl: '', // Defaulted by schema
    });

    const savedStory = await newStory.save();
    res.status(201).json(savedStory);
  } catch (error) {
    console.error("Error creating story:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Server error while creating story" });
  }
});

// Update Story - Step 1: Cover Page & Title
router.put("/stories/:storyId/step1", authMiddleware, uploadCover.single('coverPage'), async (req, res) => {
  const { storyId } = req.params;
  const { title } = req.body;
  const userId = req.user.id;

  try {
    // Handle file validation error from multer's fileFilter
    if (req.fileValidationError) {
      return res.status(400).json({ error: req.fileValidationError });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      // If story not found, and a file was uploaded, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({ error: "Story not found" });
    }

    if (story.author.toString() !== userId) {
      // If not authorized, and a file was uploaded, delete it
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({ error: "Forbidden: You are not the author of this story" });
    }

    if (title) {
      story.title = title;
    }

    // Handle file upload
    if (req.file) {
      const oldCoverPageUrl = story.coverPageUrl;
      // Path to be stored in DB, relative to the 'public' folder
      story.coverPageUrl = `/uploads/cover_pages/${req.file.filename}`;

      // If there was an old cover page, delete it from the server
      if (oldCoverPageUrl) {
        const oldFilePath = path.join(__dirname, "..", "public", oldCoverPageUrl);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log("Successfully deleted old cover page:", oldFilePath);
          } catch (err) {
            console.error("Error deleting old cover page:", err);
            // Decide if this error should be fatal or just logged
          }
        }
      }
    } else {
      // If no new file is uploaded, but title is being set, and title is the only thing in body
      // We need to ensure that if title is empty or not provided, and no file, it's a bad request.
      // However, multer processes file first. If title is also required, it should be checked.
      // The current logic is: title can be updated, file can be updated, or both.
      // If only title is in req.body and it's empty, it's a bad request.
      if (!title && !story.title) { // if no new title, and no existing title (edge case for new stories)
         // This check might be redundant if title is always required or already exists.
      }
    }

    // Check if at least title or a file is provided for update
    if (!title && !req.file && Object.keys(req.body).length === 0) {
        // If nothing is sent to update (no title, no file, empty body)
        // This check might be too strict if other fields are added to step1 later
        // For now, this means an empty request was sent.
    }


    const updatedStory = await story.save();
    res.json(updatedStory);
  } catch (error) {
    console.error("Error updating story (step 1):", error);
    // If an error occurs after file upload, delete the uploaded file
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: `Multer error: ${error.message}` });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ error: "Invalid story ID format" });
    }
    res.status(500).json({ error: "Server error while updating story" });
  }
});

// Update Story - Step 2: Characters
router.put("/stories/:storyId/step2", authMiddleware, async (req, res) => {
  const { storyId } = req.params;
  const { characters } = req.body; // Expects an array of character objects
  const userId = req.user.id;

  try {
    if (!Array.isArray(characters)) {
        return res.status(400).json({ error: "Characters data must be an array." });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    if (story.author.toString() !== userId) {
      return res.status(403).json({ error: "Forbidden: You are not the author of this story" });
    }

    story.characters = characters; // Replace the whole array; Mongoose will validate sub-documents

    const updatedStory = await story.save();
    res.json(updatedStory);
  } catch (error) {
    console.error("Error updating story (step 2 - characters):", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ error: "Invalid story ID format" });
    }
    res.status(500).json({ error: "Server error while updating story characters" });
  }
});

// Update Story - Step 3: Story Content (Chapters)
router.put("/stories/:storyId/step3", authMiddleware, async (req, res) => {
  const { storyId } = req.params;
  const { chapters } = req.body; // Expects an array of chapter objects
  const userId = req.user.id;

  try {
    if (!Array.isArray(chapters)) {
        return res.status(400).json({ error: "Chapters data must be an array." });
    }

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    if (story.author.toString() !== userId) {
      return res.status(403).json({ error: "Forbidden: You are not the author of this story" });
    }

    story.chapters = chapters; // Replace the whole array; Mongoose will validate sub-documents

    const updatedStory = await story.save();
    res.json(updatedStory);
  } catch (error) {
    console.error("Error updating story (step 3 - chapters):", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ error: "Invalid story ID format" });
    }
    res.status(500).json({ error: "Server error while updating story chapters" });
  }
});


// Get a single story by ID
router.get("/story/:storyId", authMiddleware, async (req, res) => {
  try {
    const { storyId } = req.params;

    // Check for valid ObjectId
    if (!storyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid story ID format" });
    }

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({ error: "Story not found" });
    }

    // Authorization check: user must be the author
    // (Later, this will be extended to include collaborators or public stories)
    if (story.author.toString() !== req.user.id && !story.isPublic) { // Added check for isPublic
      // For now, if it's not public, only author can see. Collaborators logic can be added.
      return res.status(403).json({ error: "Forbidden: You are not authorized to access this story" });
    }

    res.json(story);
  } catch (error) {
    console.error("Error fetching single story:", error);
    if (error.kind === 'ObjectId') {
        return res.status(400).json({ error: "Invalid story ID format" });
    }
    res.status(500).json({ error: "Server error while fetching story" });
  }
});

// Get stories by the logged-in user
router.get("/mystories", authMiddleware, async (req, res) => {
  try {
    const stories = await Story.find({ author: req.user.id }).sort({ updatedAt: -1 });
    res.json(stories);
  } catch (error) {
    console.error("Error fetching user stories:", error);
    res.status(500).json({ error: "Server error while fetching stories" });
  }
});

module.exports = router;
