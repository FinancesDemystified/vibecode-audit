#!/bin/bash
# Railway setup script for VibeCode Audit

set -e

echo "🚂 Setting up Railway project..."

# Check if logged in
if ! railway whoami &>/dev/null; then
  echo "Please log in to Railway:"
  railway login
fi

# Create new project or link existing
if [ -z "$RAILWAY_PROJECT_ID" ]; then
  echo "Creating new Railway project..."
  railway init
else
  echo "Linking to existing project..."
  railway link "$RAILWAY_PROJECT_ID"
fi

# Add Redis service
echo "Adding Redis service..."
railway add redis

# Get Redis URL
echo "Getting Redis connection details..."
REDIS_URL=$(railway variables --json | jq -r '.[] | select(.name == "REDIS_URL") | .value')

if [ -z "$REDIS_URL" ]; then
  echo "⚠️  Redis URL not found. Please add Redis service manually in Railway dashboard."
  echo "Then set REDIS_URL environment variable."
else
  echo "✅ Redis URL: $REDIS_URL"
fi

# Set environment variables
echo "Setting environment variables..."
railway variables set GROQ_API_KEY="$GROQ_API_KEY"
railway variables set NODE_ENV=production

# Deploy
echo "Deploying to Railway..."
railway up

echo "✅ Setup complete!"
echo "Your API will be available at: https://$(railway domain)"

