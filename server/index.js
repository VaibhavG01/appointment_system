import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import dotenv, { config } from 'dotenv';
import connectDB from './config/db.js';

// Routes
import AdminRouter from './routes/admin.route.js';
import FormRouter from './routes/form.route.js';
import bodyParser from 'body-parser';
import path from 'path';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const _dirname = path.resolve();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: 'https://appointment-system-h4jq.onrender.com', // Allow requests from this origin
    methods: '*', // Allow these HTTP methods
    allowedHeaders: 'Content-Type,Authorization', // Allow these headers
    credentials: true // Allow cookies to be sent with requests
}));
app.use(bodyParser.json());

app.use('/api/form', FormRouter);
app.use('/api/admin', AdminRouter);

app.use(express.static(path.join(_dirname, '/client/dist')));

app.get(/.*/, (_, res) => {
    res.sendFile(path.resolve(_dirname, 'client', 'dist', 'index.html'));
})


app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});