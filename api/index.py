from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

DATA_FILE = os.path.join(os.path.dirname(__file__), '../data.db')

# In-memory data store
data_store = []
next_id = 1

# Load data from file
def load_data():
    global data_store, next_id
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            data_store = json.load(f)
        if data_store:
            next_id = max(entry['id'] for entry in data_store) + 1

# Save data to file
def save_data():
    with open(DATA_FILE, 'w') as f:
        json.dump(data_store, f)

# Helper function to find an entry by ID
def find_entry(entry_id):
    return next((entry for entry in data_store if entry["id"] == entry_id), None)

# Get all data
@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify(data_store)

# Create new data
@app.route('/api/data', methods=['POST'])
def create_data():
    global next_id
    new_entry = request.json
    new_entry['id'] = next_id
    next_id += 1
    data_store.append(new_entry)
    save_data()
    return jsonify(new_entry), 201

# Update existing data
@app.route('/api/data/<int:entry_id>', methods=['PUT'])
def update_data(entry_id):
    entry = find_entry(entry_id)
    if entry is None:
        return jsonify({"error": "Entry not found"}), 404
    updated_entry = request.json
    for key, value in updated_entry.items():
        entry[key] = value
    save_data()
    return jsonify(entry)

# Delete data
@app.route('/api/data/<int:entry_id>', methods=['DELETE'])
def delete_data(entry_id):
    global data_store
    data_store = [entry for entry in data_store if entry['id'] != entry_id]
    save_data()
    return jsonify({"message": "Entry deleted"}), 200

load_data()

def index():
    return 'Server is running'

# Vercel function handler
def handler(event, context):
    return app(event, context)

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)