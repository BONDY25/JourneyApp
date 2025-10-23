// ==========================================================================================================
// -- Boilerplate --
// ==========================================================================================================

import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import fetch from "node-fetch";
import express from 'express';
import cors from 'cors';
import {MongoClient, ObjectId} from 'mongodb';
import path from 'path';
import {fileURLToPath} from 'url';

dotenv.config();
console.log("Mongo URI:", process.env.MONGO_URI); // test output

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let tankVolume = 64;

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

const corsOptions = {
    origin: 'http://localhost:63342', // Allow requests from this origin
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const client = new MongoClient(process.env.MONGO_URI);

// ==========================================================================================================
// -- Operational Functions --
// ==========================================================================================================

async function startServer() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('journeyAppDb');
        const journeys = db.collection('journeys');
        const users = db.collection('users');

        // LogBook Endpoint ------------------------------------------------------------------------------------------
        app.post('/api/logBook', async (req, res) => {
            try {
                const logEntry = req.body;
                console.log(logEntry);
                const db = client.db('journeyAppDb');
                await db.collection('logBook').insertOne(logEntry);
                res.status(200).json({success: true, message: "Log recorded"});
            } catch (err) {
                console.error('Error saving log:', err);
                res.status(500).send('Error saving log:');
            }
        });

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
                const {username, password, captcha} = req.body;

                const secretKey = process.env.RECAPTCHA_SECRET;
                const verifyRes = await fetch(
                    `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}`,
                    {method: "POST"}
                );
                const verifyData = await verifyRes.json();

                console.log("Captcha received:", captcha);

                if (!verifyData.success) {
                    return res.status(400).send("Captcha failed, try again.");
                }

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
                const hashedPassword = await bcryptjs.hash(req.body.password, 10);

                // create user document to insert
                const userDoc = {
                    username,
                    password: hashedPassword,
                    dateCreated: new Date(),
                    tankVolume: tankVolume,
                    defFuelCost: 0.000,
                    gallon: "UK",
                    fuelType: "Petrol",
                    userFont: "Lexend",
                    currency: "£",
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
                const isMatch = await bcryptjs.compare(password, user.password);
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
                const summary = await db.collection('journeys').aggregate([
                    {$match: {user: username}},
                    {
                        $group: {
                            _id: null,
                            totalMiles: {$sum: {$toDouble: "$distance"}},
                            totalTime: {$sum: {$toDouble: "$timeDriven"}},
                            totalFuel: {$sum: {$toDouble: "$fuelUsedL"}},
                            totalCost: {$sum: {$toDouble: "$totalCost"}},
                            avgMpg: {$avg: {$toDouble: "$mpg"}},
                            longestDistance: {$max: {$toDouble: "$distance"}},
                            longestTime: {$max: {$toDouble: "$timeDriven"}},
                            bestMpg: {$max: {$toDouble: "$mpg"}}
                        }
                    }
                ]).toArray();

                if (summary.length === 0) {
                    return res.json({
                        totalMiles: 0,
                        totalTime: 0,
                        totalFuel: 0,
                        totalCost: 0,
                        avgMpg: 0,
                        longestDistance: 0,
                        longestTime: 0,
                        bestMpg: 0
                    });
                }

                // Convert Decimal128 → JS numbers (just in case)
                const cleanSummary = Object.fromEntries(
                    Object.entries(summary[0]).map(([key, val]) => [key, Number(val)])
                );

                res.json(cleanSummary);
            } catch (err) {
                console.error(err);
                res.status(500).send("Error retrieving summary");
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

                const nintyDaysAgo = new Date(now);
                nintyDaysAgo.setDate(now.getDate() - 90);

                const sixMonthsAgo = new Date(now);
                sixMonthsAgo.setDate(now.getDate() - 180);

                const threeSixFiveDaysAgo = new Date(now);
                threeSixFiveDaysAgo.setDate(now.getDate() - 365);

                const result = await journeysCollection.aggregate([
                    {
                        $match: {user: username}
                    },
                    {
                        // Normalize dateTime
                        $addFields: {
                            parsedDate: {
                                $cond: [
                                    {$eq: [{$type: "$dateTime"}, "string"]},
                                    {$dateFromString: {dateString: "$dateTime"}},
                                    "$dateTime"
                                ]
                            }
                        }
                    },
                    {
                        $match: {
                            parsedDate: {$gte: threeSixFiveDaysAgo}
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            seven: {
                                $sum: {$cond: [{$gte: ["$parsedDate", sevenDaysAgo]}, "$totalCost", 0]}
                            },
                            fourteen: {
                                $sum: {$cond: [{$gte: ["$parsedDate", fourteenDaysAgo]}, "$totalCost", 0]}
                            },
                            twentyEight: {
                                $sum: {$cond: [{$gte: ["$parsedDate", twentyEightDaysAgo]}, "$totalCost", 0]}
                            },
                            ninty: {
                                $sum: {$cond: [{$gte: ["$parsedDate", nintyDaysAgo]}, "$totalCost", 0]}
                            },
                            sixMonth: {
                                $sum: {$cond: [{$gte: ["$parsedDate", sixMonthsAgo]}, "$totalCost", 0]}
                            },
                            threeSixFive: {
                                $sum: {$cond: [{$gte: ["$parsedDate", threeSixFiveDaysAgo]}, "$totalCost", 0]}
                            }
                        }
                    }
                ]).toArray();

                const costs = result.length > 0 ? result[0] : {seven: 0, fourteen: 0, twentyEight: 0};

                res.json({cost: costs});
            } catch (err) {
                console.error("Error retrieving costs:", err);
                res.status(500).send("Error retrieving costs");
            }
        });


        // Import Journey ---------------------------------------------------------------
        app.post('/api/importJourneys', async (req, res) => {
            try {
                let journeys = req.body;
                console.log(journeys);

                // Check if Array has data
                if (!Array.isArray(journeys) || journeys.length === 0) {
                    return res.status(400).send("No journeys provided");
                }

                // Clean data before import
                journeys = journeys.map(j => {
                    const distance = Number(j.distance) || 0;
                    const mpg = Number(j.mpg) || 0;

                    const fuelUsedL = mpg > 0 ? distance / (mpg / 3.785) : 0;
                    const percOfTank = tankVolume > 0 ? fuelUsedL / tankVolume : 0;

                    return {
                        user: j.user?.toLowerCase() || "unknown",
                        description: j.description || "",
                        dateTime: new Date(j.dateTime),
                        distance,
                        mpg,
                        timeDriven: Number(j.timeDriven) || 0,
                        temp: Number(j.temp) || 0,
                        condition: j.condition || "Dry",
                        costPl: Number(j.costPl) || 0,
                        avgSpeed: Number(j.avgSpeed) || 0,
                        totalCost: Number(j.totalCost) || 0,
                        costPerMile: Number(j.costPerMile) || 0,
                        fuelUsedL,
                        percOfTank
                    };
                });


                // Declare Db & Collection
                const db = client.db('journeyAppDb');
                const collection = db.collection('journeys');

                // insert records
                await collection.insertMany(journeys);
                res.status(201).send("Journeys imported successfully");
            } catch (err) {
                console.error("Error importing journeys:", err);
                res.status(500).send("Error importing journeys");
            }
        });

        // Full Stats Endpoint ---------------------------------------------------------------
        app.get('/api/stats/:username', async (req, res) => {
            // Declare Parameters
            const username = req.params.username;
            const {start, end} = req.query;

            try {
                const query = {user: username};

                // Check date parameters
                if (start || end) {
                    query.dateTime = {};
                    if (start) query.dateTime.$gte = new Date(start);
                    if (end) {
                        const endDate = new Date(end);
                        endDate.setHours(23, 59, 59, 999); // Included end of the date
                        query.dateTime.$lte = endDate;
                    }
                }

                const journeysData = await journeys.aggregate([
                    {$match: {user: username}},
                    {$addFields: {dateTimeCorrected: {$toDate: "$dateTime"}}},
                    {
                        $match: (() => {
                            const filter = {};
                            if (start) filter.$gte = new Date(start);
                            if (end) {
                                const endDate = new Date(end);
                                endDate.setHours(23, 59, 59, 999);
                                filter.$lte = endDate;
                            }
                            return Object.keys(filter).length ? {dateTimeCorrected: filter} : {};
                        })()
                    }
                ]).toArray();

                console.log(journeysData);

                // Handle empty array
                if (!journeysData || journeysData.length === 0) {
                    return res.json({
                        totalMiles: 0,
                        totalTime: 0,
                        totalFuel: 0,
                        totalCost: 0,
                        avgMilesPerTank: 0,
                        avgMpg: 0,
                        avgSpeed: 0,
                        avgCostPerDay: 0,
                        avgCostPerMile: 0,
                        avgFuelPrice: 0,
                        avgTemp: 0,
                        avgTimeDriven: 0
                    });
                }

                // Calculate base totals
                const totalMiles = journeysData.reduce((sum, j) => sum + j.distance, 0);
                const totalTime = journeysData.reduce((sum, j) => sum + j.timeDriven, 0);
                const totalFuel = journeysData.reduce((sum, j) => sum + j.fuelUsedL, 0);
                const totalCost = journeysData.reduce((sum, j) => sum + j.totalCost, 0);

                // Calculate Averages
                const avgTimeDriven = totalTime / journeysData.length;
                const avgMpg = journeysData.reduce((sum, j) => sum + (+j.mpg || 0), 0) / journeysData.length;
                const avgSpeed = journeysData.reduce((sum, j) => sum + j.avgSpeed, 0) / journeysData.length;
                const avgFuelPrice = journeysData.reduce((sum, j) => sum + j.costPl, 0) / journeysData.length;
                const avgTemp = journeysData.reduce((sum, j) => sum + j.temp, 0) / journeysData.length;

                // Derived Stats
                const avgMilesPerTank = totalFuel > 0 ? totalMiles / totalFuel * tankVolume : 0;
                const avgCostPerDay = (() => {
                    const dates = journeysData.map(j => new Date(j.dateTime));
                    const minDate = start ? new Date(start) : new Date(Math.min(...dates));
                    const maxDate = end ? new Date(end) : new Date(Math.max(...dates));
                    const diffDays = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
                    return totalCost / diffDays;
                })();
                const avgCostPerMile = totalMiles > 0 ? totalCost / totalMiles : 0;

                // Build object
                res.json({
                    totalMiles,
                    totalTime,
                    totalFuel,
                    totalCost,
                    avgMilesPerTank,
                    avgMpg,
                    avgSpeed,
                    avgCostPerDay,
                    avgCostPerMile,
                    avgFuelPrice,
                    avgTemp,
                    avgTimeDriven
                });
            } catch (err) {
                console.error("Error retrieving stats:", err);
                res.status(500).send("Error retrieving stats");
            }
        });

        // Get Users Endpoint -------------------------------------------------------------------
        app.get('/api/getUsers/:username', async (req, res) => {
            const username = req.params.username.toLowerCase();
            try {
                const db = client.db('journeyAppDb');
                const user = await db.collection('users').findOne({username}, {projection: {password: 0}});
                if (!user) return res.status(404).send('No user found.');
                res.json(user);
            } catch (err) {
                console.error("Error retrieving user:", err);
                res.status(500).send("Error retrieving user");
            }
        });

        // Save User Endpoint -----------------------------------------------------------------
        app.put('/api/saveUsers/:username', async (req, res) => {
            const username = req.params.username.toLowerCase();
            const {
                tankVolume,
                defFuelCost,
                gallon,
                fuelType,
                userFont,
                currency,
                budgetEnabled,
                budgetRange,
                budgetAmount,
                resetDay,
                newPassword
            } = req.body;

            try {
                const db = client.db('journeyAppDb');
                const updateFields = {
                    tankVolume,
                    defFuelCost,
                    gallon,
                    fuelType,
                    userFont,
                    currency,
                    budgetEnabled,
                    budgetRange,
                    budgetAmount,
                    resetDay
                };

                // Add Password if provided
                if (newPassword && newPassword.trim() !== "") {
                    updateFields.password = await bcryptjs.hash(newPassword, 10);
                }

                console.log(`Payload received: ${JSON.stringify(updateFields)}`);

                const result = await db.collection('users').updateOne(
                    {username},
                    {$set: updateFields}
                );

                if (result.matchedCount === 0) {
                    return res.status(404).send('No user found.');
                }

                res.send("Successfully updated user");
            } catch (err) {
                console.error("Error updating user:", err);
                res.status(500).send("Error updating user");
            }
        });

        // Your Journeys Endpoint ----------------------------------------------------------------
        app.get('/api/getJourneys', async (req, res) => {
            try {
                const {username} = req.query; // safer to get from query

                const journeys = await db.collection('journeys').aggregate([
                    {
                        $match: {user: username}
                    },
                    {
                        $addFields: {
                            dateTimeCorrected: {$toDate: "$dateTime"} // cast to Date
                        }
                    },
                    {
                        $sort: {dateTimeCorrected: -1} // newest first
                    }
                ]).toArray();

                res.json(journeys);
            } catch (err) {
                console.error("Error retrieving journeys", err);
                res.status(500).send("Error retrieving journeys");
            }
        });

        // Journey Details Endpoint ------------------------------------------------------------------
        app.get("/api/getJourney/:id", async (req, res) => {
            try {
                const journeyId = req.params.id;
                const journey = await db.collection("journeys").findOne({_id: new ObjectId(journeyId)});

                if (!journey) {
                    return res.status(404).json({error: "Journey not found"});
                }

                res.json(journey);
            } catch (error) {
                console.error("Error fetching journey:", error);
                res.status(500).json({error: "Failed to fetch journey"});
            }
        });

        // Get total journeys -------------------------------------------------------------
        app.get('/api/getTotalJourneys/:username', async (req, res) => {
            try {
                const username = req.params.username.toLowerCase();
                const count = await db.collection('journeys').countDocuments({user: username});
                res.json({total: count});
            } catch (error) {
                console.error("Error fetching total journeys:", error);
                res.status(500).json({error: "Failed to fetch total journeys"});
            }
        });

        // Get single journey ---------------------------------------------------------------
        app.get('/api/journeys/:id', async (req, res) => {
            try {
                const {id} = req.params;
                const journey = await db.collection('journeys').findOne({_id: new ObjectId(id)});
                if (!journey) return res.status(404).send('No journey found.');
                res.json(journey);
            } catch (err) {
                res.status(500).send("Error retrieving journeys");
            }
        });

        // Update journey -------------------------------------------------------------------
        app.put('/api/journeys/:id', async (req, res) => {
            try {
                const {id} = req.params;
                const updated = req.body;
                const result = await db.collection('journeys').updateOne(
                    {_id: new ObjectId(id)},
                    {$set: updated},
                );
                res.json(result);
            } catch (err) {
                res.status(500).send("Error updating journeys");
            }
        });

        // Delete journey -------------------------------------------------------------------
        app.delete('/api/journeys/:id', async (req, res) => {
            try {
                const {id} = req.params;
                await db.collection('journeys').deleteOne({_id: new ObjectId(id)});
                res.sendStatus(204);
            } catch (err) {
                res.status(500).send("Error deleting journeys");
            }
        });

        // Get Budget Summary ------------------------------------------------------------------
        app.get('/api/budget/:username', async (req, res) => {
            const username = req.params.username.toLowerCase();
            const db = client.db('journeyAppDb');

            try {
                // Fetch user's budget settings
                const user = await db.collection('users').findOne({ username });
                if (!user || !user.budgetEnabled) {
                    return res.json({ enabled: false });
                }

                const { budgetRange, budgetAmount, resetDay } = user;

                // Determine start date for current budget period
                const now = new Date();
                let startDate;

                switch (budgetRange) {
                    case "Daily":
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case "Weekly":
                        const today = now.getDay(); // 0 = Sunday
                        const target = parseInt(resetDay) || 1; // Default Monday
                        const diff = (today < target ? 7 : 0) + today - target;
                        startDate = new Date(now);
                        startDate.setDate(now.getDate() - diff);
                        break;
                    case "Monthly":
                        startDate = new Date(now.getFullYear(), now.getMonth(), parseInt(resetDay) || 1);
                        break;
                    case "Quarterly":
                        const quarter = Math.floor(now.getMonth() / 3);
                        startDate = new Date(now.getFullYear(), quarter * 3, 1);
                        break;
                    case "Yearly":
                        startDate = new Date(now.getFullYear(), 0, 1);
                        break;
                    default:
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                }

                // Fetch all journeys in period and normalize dates
                const journeys = await db.collection('journeys').aggregate([
                    {
                        $addFields: {
                            dateAsDate: {
                                $cond: [
                                    { $eq: [{ $type: "$dateTime" }, "string"] },
                                    { $dateFromString: { dateString: "$dateTime" } },
                                    "$dateTime"
                                ]
                            }
                        }
                    },
                    {
                        $match: {
                            user: username,
                            dateAsDate: { $gte: startDate }
                        }
                    },
                    { $sort: { dateAsDate: 1 } }, // sort chronologically
                    {
                        $project: {
                            _id: 0,
                            date: "$dateAsDate",
                            cost: "$totalCost"
                        }
                    }
                ]).toArray();

                // Calculate cumulative total cost and over/under
                const totalCost = journeys.reduce((sum, j) => sum + j.cost, 0);
                const overUnder = budgetAmount - totalCost;

                res.json({
                    enabled: true,
                    period: budgetRange,
                    budget: budgetAmount,
                    cost: totalCost,
                    overUnder,
                    journeys // array of journeys with date and cost
                });

            } catch (err) {
                console.error("Error calculating budget:", err);
                res.status(500).send("Error calculating budget");
            }
        });

        // Get Graph Endpoint ---------------------------------------------------------------------
        app.get('/api/graph/:username', async (req, res) => {
            try {
                const {username} = req.params;
                const {start, end, xAxis, yAxis} = req.query;

                if (!xAxis || !yAxis) {
                    return res.status(400).json({error: "xAxis and yAxis are required"});
                }

                const db = client.db('journeyAppDb');

                // convert dates
                const startDate = start ? new Date(start) : new Date("1970-01-01");
                const endDate = end ? new Date(end) : new Date();

                // Map front-end fields to db fields
                const fieldMap = {
                    date: "dateTime",
                    distance: "distance",
                    timeDriven: "timeDriven",
                    avgSpeed: "avgSpeed",
                    mpg: "mpg",
                    cost: "totalCost"
                };

                const xField = fieldMap[xAxis];
                const yField = fieldMap[yAxis];

                if (!xField || !yField) {
                    return res.status(400).json({ error: "Invalid xAxis or yAxis option" });
                }

                // Query journeys within date range
                const journeys = await db.collection('journeys')
                    .find({
                        user: username,
                        dateTime: {$get: startDate, $lte: endDate},
                    })
                    .project({
                        [xField]: 1,
                        [yField]: 1,
                        dateTime: 1,
                        _id: 0
                    })
                    .sort({[xField]: 1})
                    .toArray();

                // Format response as array of { x, y }
                const result = journeys.map(j => ({
                    x: j[xField],
                    y: j[yField]
                }));

                return res.json({ data: result });

            } catch (err) {
                console.error("Error getting graph:", err);
                res.status(500).send("Error getting graph");
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
