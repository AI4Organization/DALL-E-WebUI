#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Path to .env file
ENV_FILE="$SCRIPT_DIR/.env"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    echo "Please create a .env file with your environment variables."
    exit 1
fi

# Export all variables from .env file
# Skip comments and empty lines, handle exports with and without 'export' keyword
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines
    [[ -z "$line" ]] && continue

    # Skip comments
    [[ "$line" =~ ^[[:space:]]*# ]] && continue

    # Remove 'export ' prefix if present
    line="${line#export }"

    # Export the variable
    export "$line"
done < "$ENV_FILE"

echo "Environment variables loaded from $ENV_FILE"

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "Error: Port 3000 is already in use!"
    echo "Please stop the existing service before starting a new one."
    echo "You can find the process using: lsof -i :3000"
    exit 1
fi

echo "Starting frontend service on port 3000..."
echo ""

# Run npm run dev:rsbuild
npm run dev:rsbuild
