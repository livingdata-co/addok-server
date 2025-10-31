#!/bin/bash
set -e

# Initialize data if needed
/app/init-data.sh

# Start the application
exec node server.js
