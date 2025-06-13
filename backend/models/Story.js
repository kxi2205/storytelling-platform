const mongoose = require("mongoose");

const CharacterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  details: { type: String },
  profilePicUrl: { type: String },
  category: { type: String, enum: ['lead', 'supporting', 'background'], required: true }
});

const ChapterSchema = new mongoose.Schema({
  chapterTitle: { type: String, default: 'Untitled Chapter' },
  chapterContent: { type: String, default: '' }
});

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
  coverPageUrl: { type: String },
  characters: [CharacterSchema],
  chapters: [ChapterSchema],
  isPublic: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Story', StorySchema);
