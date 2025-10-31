#!/bin/bash
set -e

# Script to initialize addok data
# If ADDOK_DATA_URL is set, download and extract the archive
# If it's a local file path (starts with /), just extract it
# If not set, skip initialization (user can mount a volume)

# Detect if running in Docker or locally
if [ -d "/app" ]; then
    # Running in Docker
    DATA_DIR="/app/data"
    TEMP_ARCHIVE="/tmp/addok-data.zip"
    ENV_FILE="/app/.env"
else
    # Running locally
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    DATA_DIR="${SCRIPT_DIR}/data"
    TEMP_ARCHIVE="${SCRIPT_DIR}/data.zip"
    ENV_FILE="${SCRIPT_DIR}/.env"
fi

# Load .env file if it exists and ADDOK_DATA_URL is not already set
if [ -f "$ENV_FILE" ] && [ -z "$ADDOK_DATA_URL" ]; then
    echo "Loading environment variables from .env file..."
    # Export only ADDOK_DATA_URL from .env
    export $(grep -v '^#' "$ENV_FILE" | grep 'ADDOK_DATA_URL' | xargs)
fi

if [ -z "$ADDOK_DATA_URL" ]; then
    echo "ADDOK_DATA_URL not set, skipping data initialization."
    echo "You can mount your data directory as a volume at ${DATA_DIR}"
    exit 0
fi

echo "Initializing addok data..."

# Create data directory if it doesn't exist
mkdir -p "$DATA_DIR"

# Check if data is already initialized
if [ -f "$DATA_DIR/addok.conf" ] && [ -f "$DATA_DIR/addok.db" ]; then
    echo "Data already initialized in ${DATA_DIR}, skipping download."
    exit 0
fi

# Handle local file path
if [[ "$ADDOK_DATA_URL" == /* ]]; then
    echo "Using local file: ${ADDOK_DATA_URL}"
    if [ ! -f "$ADDOK_DATA_URL" ]; then
        echo "Error: Local file ${ADDOK_DATA_URL} not found!"
        exit 1
    fi
    ARCHIVE_PATH="$ADDOK_DATA_URL"
else
    # Download from URL
    echo "Downloading data from: ${ADDOK_DATA_URL}"
    echo "This may take a few minutes..."
    wget -nv --show-progress "$ADDOK_DATA_URL" -O "$TEMP_ARCHIVE" || {
        echo "Error: Failed to download ${ADDOK_DATA_URL}"
        exit 1
    }
    ARCHIVE_PATH="$TEMP_ARCHIVE"
fi

# Extract archive
echo "Extracting archive to ${DATA_DIR}..."
unzip -q "$ARCHIVE_PATH" -d "$DATA_DIR" || {
    echo "Error: Failed to extract archive"
    exit 1
}

# Clean up temporary file if we downloaded it
if [ "$ARCHIVE_PATH" = "$TEMP_ARCHIVE" ]; then
    echo "Cleaning up temporary files..."
    rm -f "$TEMP_ARCHIVE"
fi

echo "Data initialization complete!"
echo "Data directory: ${DATA_DIR}"
ls -lh "$DATA_DIR"
