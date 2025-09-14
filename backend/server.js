require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path"); // Require the 'path' module
const fs = require("fs"); // Import the 'fs' module

const app = express();

// Define the profile pictures directory path
const profilePicsDir = path.join(__dirname, 'public', 'uploads', 'profile_pics');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(cors());

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const storiesRouter = require("./routes/stories"); // Import stories router
app.use("/api/stories", storiesRouter); // Mount stories router

// Add payment endpoint to prevent 500 errors
app.post("/api/create-payment", (req, res) => {
  // This is a placeholder endpoint to prevent 500 errors
  // In a real application, this would integrate with a payment processor like Stripe
  res.status(501).json({
    error: "Payment functionality not implemented yet",
    message: "This endpoint is a placeholder. Payment integration with Stripe or other providers would be implemented here."
  });
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("MongoDB Connection Error:", err));

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Ensure the profile pictures directory exists
if (!fs.existsSync(profilePicsDir)) {
  fs.mkdirSync(profilePicsDir, { recursive: true });
  console.log(`✅ Created directory: ${profilePicsDir}`);
} else {
  console.log(`✅ Directory already exists: ${profilePicsDir}`);
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});
