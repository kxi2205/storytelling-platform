const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  username: { type: String, unique: true },
  password: String,
  profilePic: String,
  role: {
    type: String,
    enum: ['Writer', 'Reader', 'Collaborator', 'Admin'],
    default: 'Writer',
  },
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
