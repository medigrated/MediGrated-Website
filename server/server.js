const express = require('express');
require('dotenv').config();
const connectDB = require('./database/db');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth/auth-routes');
const patientRoutes = require('./routes/patient/patient-routes');
const chatbotRoutes = require('./routes/chatbot/chatbot-routes');
const recommendationRoutes = require('./routes/recommendations/recommendations-routes');
const reportRoutes = require('./routes/reports/report-routes');
const familyRoutes = require('./routes/family/family-routes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(
    cors({
        // during development, allow any origin so Vite's port changes don't break CORS
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Expires', 'Pragma'],
        credentials: true
    })
);
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/family', familyRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
