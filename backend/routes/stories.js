const express = require("express");
const Story = require("../models/Story");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new story
router.post("/create", authMiddleware, async (req, res) => {
  const { title, genre, description } = req.body;
  const author = req.user.id; // From authMiddleware

  try {
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const newStory = new Story({
      title,
      genre,
      description,
      author,
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
    // (Later, this will be extended to include collaborators)
    if (story.author.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: You are not authorized to access this story" });
    }

    res.json(story);
  } catch (error) {
    console.error("Error fetching single story:", error);
    if (error.kind === 'ObjectId') { // Mongoose specific error for bad ID format, though regex check above is better
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
