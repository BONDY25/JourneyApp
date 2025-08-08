// models/Journey.js
const mongoose = require('mongoose');

const JourneySchema = new mongoose.Schema({
    description: String,
    datetime: Date,
    distance: Number,
    mpg: Number,
    timeDriven: String,
    temp: Number,
    condition: String,
    costPl: Number,
    avgSpeed: Number,
    totalCost: Number,
    costPerMile: Number,
    fuelUsedL: Number,
    percOfTank: Number,
});

module.exports = mongoose.model('Journey', JourneySchema);
