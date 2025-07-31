const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

// This allows us to use environment variables from a .env file locally
// Run `npm install dotenv` to add this package
require('dotenv').config(); 

const app = express();
// The hosting service will provide the PORT through an environment variable.
// We fall back to 3000 for local development.
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// --- Database Connection ---
// The connection string is now taken from an environment variable.
// This is more secure and flexible.
const dbURI = process.env.MONGODB_URI; 

if (!dbURI) {
    console.error('FATAL ERROR: MONGODB_URI is not defined in environment variables.');
    process.exit(1); // Exit the application if the DB connection string is missing
}

mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- API Routes ---
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});