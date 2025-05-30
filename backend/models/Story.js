const mongoose = require("mongoose");

const StorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  genre: String,
  description: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  content: {
    type: String,
    default: '',
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Story', StorySchema);
