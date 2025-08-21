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
        const users = db.collection('users');

        // Insert Journey --------------------------------------------------------------------------------------------
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

        // Insert User --------------------------------------------------------------------------------------------
        app.post('/api/users', async (req, res) => {
            try {
                const {username, password} = req.body;

                // check is fields are complete
                if (!username || !password) {
                    return res.status(400).send('Username and Password required');
                }

                // check if the user already exists in the database
                const existing = await users.findOne({username});
                if (existing) {
                    return res.status(400).send('Username already exist');
                }

                // create user document to insert
                const userDoc = {
                    username,
                    password,
                    dateCreated: new Date(),
                };

                // insert the user into the database
                await users.insertOne(userDoc);
                res.status(201).send('User created');
            } catch (err) {
                console.error('Error saving user:', err);
                res.status(500).send('Error saving user:');
            }
        });

        // Check User for Login --------------------------------------------------------------------------------------------
        app.post('/api/login', async (req, res) => {
            try {
                const {username, password} = req.body;
                const user = await users.findOne({username, password});
                if (!user) {
                    return res.status(400).send('Invalid username or password');
                }

                res.status(200).json({username: user.username});
            } catch (err) {
                console.error('Error saving user:', err);
                res.status(500).send('Error logging in:');
            }
        });

        app.listen(3000, () => {
            console.log('Server running at http://localhost:3000');
        });
    }
    catch (err) {
        console.error('Failed to connect to MongoDB:', err);
    }
}

startServer();
