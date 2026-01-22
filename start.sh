#!/bin/bash

echo "Starting FocusFlow..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

# Start the server
echo "Starting server on http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""
node server.js