// projectsRoutes.js

const express = require('express');
const Project = require('../models/Project');

const router = express.Router();

// POST request to create a new project
router.post('/create', async (req, res) => {
  try {
    const projectData = req.body;
    const project = new Project(projectData);
    await project.save();
    res.status(201).json({ project, message: 'Project created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
