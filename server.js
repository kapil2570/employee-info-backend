const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json()); // For parsing application/json
app.use(cors()); // Enable CORS for all routes

const DATA_FILE = path.join(__dirname, 'data.db');

// In-memory data store
let dataStore = [];
let nextId = 1;

// Load data from file
function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        if (data.trim() === '') {
            // File is empty, initialize dataStore as an empty array
            dataStore = [];
        } else {
            try {
                dataStore = JSON.parse(data);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                dataStore = []; // Initialize dataStore as an empty array in case of error
            }
        }
        if (dataStore.length > 0) {
            nextId = Math.max(...dataStore.map(entry => entry.id)) + 1;
        }
    }
}


// Save data to file
function saveData() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataStore, null, 2));
}

// Helper function to find an entry by ID
function findEntry(entryId) {
    return dataStore.find(entry => entry.id === entryId);
}

// Get all data
app.get('/api/data', (req, res) => {
    res.json(dataStore);
});

// Create new data
app.post('/api/data', (req, res) => {
    const newEntry = req.body;
    newEntry.id = nextId++;
    dataStore.push(newEntry);
    saveData();
    res.status(201).json(newEntry);
});

// Update existing data
app.put('/api/data/:entryId', (req, res) => {
    const entryId = parseInt(req.params.entryId, 10);
    const entry = findEntry(entryId);
    if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
    }
    const updatedEntry = req.body;
    Object.assign(entry, updatedEntry);
    saveData();
    res.json(entry);
});

// Delete data
app.delete('/api/data/:entryId', (req, res) => {
    const entryId = parseInt(req.params.entryId, 10);
    dataStore = dataStore.filter(entry => entry.id !== entryId);
    saveData();
    res.json({ message: 'Entry deleted' });
});

loadData();

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
