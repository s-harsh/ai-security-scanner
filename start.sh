#!/bin/bash

echo "Starting SecureScan Security Scanner..."
echo

echo "Installing dependencies..."
npm install

echo
echo "Starting development servers..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:3001"
echo

npm run dev:full
