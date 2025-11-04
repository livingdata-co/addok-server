#!/bin/bash
set -e
set -o pipefail

# Script to initialize addok data
# If ADDOK_DATA_URL is set, stream-extract a tar.zst archive
# If it's a local file path (starts with /), stream-extract it
# If not set, skip initialization (user can mount a volume)

# Detect if running in Docker or locally
if [ -d "/app" ]; then
    # Running in Docker
    DATA_DIR="/app/data"
    ENV_FILE="/app/.env"
else
    # Running locally
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    DATA_DIR="${SCRIPT_DIR}/data"
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
    echo "Data already initialized in ${DATA_DIR}, skipping initialization."
    exit 0
fi

# Check required commands
command -v tar >/dev/null 2>&1 || { echo "Error: tar is required."; exit 1; }
if command -v zstd >/dev/null 2>&1; then
    decompress() { zstd -d --stdout "$@"; }
elif command -v zstdcat >/dev/null 2>&1; then
    decompress() { zstdcat "$@"; }
else
    echo "Error: zstd or zstdcat is required to decompress tar.zst archives."
    exit 1
fi

# Choose HTTP downloader for streaming
if command -v curl >/dev/null 2>&1; then
    downloader="curl -fsSL"
elif command -v wget >/dev/null 2>&1; then
    downloader="wget -qO-"
else
    echo "Error: curl or wget is required to stream-download the archive."
    exit 1
fi

# Handle local file path vs remote URL
if [[ "$ADDOK_DATA_URL" == /* ]]; then
    echo "Using local file: ${ADDOK_DATA_URL}"
    if [ ! -f "$ADDOK_DATA_URL" ]; then
        echo "Error: Local file ${ADDOK_DATA_URL} not found!"
        exit 1
    fi
    MODE="local"
    ARCHIVE_PATH="$ADDOK_DATA_URL"
else
    echo "Downloading and extracting data from: ${ADDOK_DATA_URL}"
    MODE="remote"
fi

# Empty data directory safely (preserve the directory itself)
echo "Emptying data directory ${DATA_DIR}..."
# remove all entries inside DATA_DIR (including dotfiles)
find "$DATA_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

# Extract archive (streamed, no full download)
echo "Extracting archive to ${DATA_DIR}..."
if [ "$MODE" = "local" ]; then
    # local file -> decompress then tar extract
    if ! decompress "$ARCHIVE_PATH" | tar -x -C "$DATA_DIR"; then
        echo "Error: Failed to extract local archive ${ARCHIVE_PATH}"
        exit 1
    fi
else
    # remote -> stream download, decompress, then tar extract
    if ! (eval "$downloader \"${ADDOK_DATA_URL}\"" | decompress | tar -x -C "$DATA_DIR"); then
        echo "Error: Failed to download/extract ${ADDOK_DATA_URL}"
        exit 1
    fi
fi

echo "Data initialization complete!"
echo "Data directory: ${DATA_DIR}"
ls -lh "$DATA_DIR"
