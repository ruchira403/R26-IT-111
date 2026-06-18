// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

//  Import the Caries routes file
const cariesRoutes = require('./routes/cariesRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // read JSON body from requests

app.use('/api', cariesRoutes); // '/api/save-diagnosis' 

// Server Port configuration
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(` -> Shared Node.js Backend Server is running on port ${PORT}`);
});