import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const corsOptions = {
    origin: 'http://localhost:63342', // Allow requests from this origin
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

const client = new MongoClient(process.env.MONGO_URI);

async function startServer() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('journeyAppDb');
        const journeys = db.collection('journeys');

        app.post('/api/journeys', async (req, res) => {
            try {
                await journeys.insertOne(req.body);
                console.log('Journey saved:', req.body);
                res.status(201).send('Journey saved');
            } catch (err) {
                console.error('Error saving journey:', err);
                res.status(500).send('Error saving journey');
            }
        });

        app.listen(3000, () => {
            console.log('Server running at http://localhost:3000');
        });
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
    }
}

startServer();
