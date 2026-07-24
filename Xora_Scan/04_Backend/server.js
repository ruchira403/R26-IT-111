// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const cariesRoutes = require('./routes/cariesRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', cariesRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(` -> Shared Node.js Backend Server is running on port ${PORT}`);
});