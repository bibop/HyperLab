require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes'); // Adjust the path as necessary

const app = express();
const PORT = process.env.PORT || 5001;

// Database connection without deprecated options
mongoose.connect('mongodb://localhost:27017/hyperlab')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/favicon.ico', express.static(path.join(__dirname, '/Users/bibop/Library/CloudStorage/GoogleDrive-mrbibop@gmail.com/Il mio Drive/AI_Dev/HyperLab/hyperlab-backend/', 'favicon.ico')));

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to Hyper-Lab Backend!');
});

// User routes
app.use('/api/users', userRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
