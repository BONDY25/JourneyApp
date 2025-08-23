import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

import express from 'express';
import cors from 'cors';
import {MongoClient} from 'mongodb';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

const corsOptions = {
    origin: 'http://localhost:63342', // Allow requests from this origin
    optionsSuccessStatus: 200
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

                // Hash password
                const hashedPassword = await bcrypt.hash(req.body.password, 10);

                // create user document to insert
                const userDoc = {
                    username,
                    password: hashedPassword,
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

                // Find user
                const user = await users.findOne({username});
                if (!user) {
                    return res.status(400).send('Invalid username or password');
                }

                // Compare password
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(400).send('Invalid username or password');
                }

                // Success Login
                res.status(200).json({username: user.username});
            } catch (err) {
                console.error('Error saving user:', err);
                res.status(500).send('Error logging in:');
            }
        });

        // Get user totals ---------------------------------------------------------------------------------
        app.get('/api/summary/:username', async (req, res) => {

            const username = req.params.username;

            try {
                // Get all user journey data
                const summary = await db.collection('journeys').aggregate([
                    {$match: {user: username}},
                    {
                        // Calculate summary
                        $group: {
                            _id: null,
                            totalMiles: {$sum: "$distance"},
                            totalTime: {$sum: "$timeDriven"},
                            totalFuel: {$sum: "$fuelUsedL"},
                            totalCost: {$sum: "$totalCost"},
                            avgMpg: {$avg: "$mpg"}
                        }
                    }
                ]).toArray();

                // Handle No data
                if (summary.length === 0) {
                    return res.json({
                        totalMiles: 0,
                        totalTime: 0,
                        totalFuel: 0,
                        totalCost: 0,
                        avgMpg: 0
                    });
                }

                // Return results
                res.json(summary[0]);
            } catch (err) {
                console.error(err);
                res.status(500).send('Error retrieving summary');
            }

        });

        // Cost Breakdown --------------------------------------------------------------------------------
        app.get('/api/costs/:username', async (req, res) => {
            const username = req.params.username;

            try {
                const journeysCollection = db.collection('journeys');
                const now = new Date();
                const sevenDaysAgo = new Date(now);
                sevenDaysAgo.setDate(now.getDate() - 7);
                const fourteenDaysAgo = new Date(now);
                fourteenDaysAgo.setDate(now.getDate() - 14);
                const twentyEightDaysAgo = new Date(now);
                twentyEightDaysAgo.setDate(now.getDate() - 28);

                const result = await journeysCollection.aggregate([
                    {$match: {user: username, dateTime: {$gte: twentyEightDaysAgo}}},
                    {
                        $group: {
                            _id: null,
                            seven: {
                                $sum: {$cond: [{$gte: ["$dateTime", sevenDaysAgo]}, "$totalCost", 0]}
                            },
                            fourteen: {
                                $sum: {$cond: [{$gte: ["$dateTime", fourteenDaysAgo]}, "$totalCost", 0]}
                            },
                            twentyEight: {$sum: "$totalCost"} // everything in the last 28 days
                        }
                    }
                ]).toArray();

                console.log(result);
                const costs = result.length > 0 ? result[0] : {seven: 0, fourteen: 0, twentyEight: 0};

                res.json({cost: costs});
            } catch (err) {
                console.error("Error retrieving costs:", err);
                res.status(500).send("Error retrieving costs");
            }
        });

        // Import Journey ---------------------------------------------------------------
        app.post("/api/importJourneys", async (req, res) => {
            const {journeys} = req.body;

            // Check valid data
            if (!Array.isArray(journeys) || journeys.length === 0) {
                return res.status(400).send('No journeys provided');
            }

            // Import Journeys
            try {
                const journeysCollection = db.collection('journeys');
                await journeysCollection.insertMany(journeys);
                res.status(201).send('Successfully imported journeys');
            } catch (err) {
                console.error('Error importing Journeys:', err);
                res.status(500).send('Error importing Journeys:');
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
