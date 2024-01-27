// Projects.js

const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  createdBy: mongoose.Schema.Types.ObjectId // Reference to User model
});

module.exports = mongoose.model('Project', projectSchema);
