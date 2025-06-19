#!/bin/bash

# Deployment script with npm rate limiting handling

echo "Setting up npm configuration for deployment..."

# Configure npm to handle rate limiting
npm config set registry https://registry.npmjs.org/
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set network-timeout 100000

echo "Installing dependencies with pnpm..."

# Install dependencies with retry logic
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    echo "Attempt $((RETRY_COUNT + 1)) of $MAX_RETRIES"
    
    if pnpm install --no-frozen-lockfile --network-timeout 100000 --prefer-offline; then
        echo "Dependencies installed successfully!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "Installation failed. Waiting 30 seconds before retry..."
            sleep 30
        else
            echo "All retry attempts failed. Exiting."
            exit 1
        fi
    fi
done

echo "Running database migration..."
npx prisma db push --accept-data-loss

echo "Building the application..."
npm run build

echo "Deployment script completed successfully!" 