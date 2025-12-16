#!/bin/bash

# Fix macOS Node.js/npm permissions
# Run this script with: bash fix-macos-permissions.sh

echo "🔧 Fixing macOS Node.js permissions..."

# 1. Fix Homebrew permissions
echo "1. Fixing Homebrew permissions..."
sudo chown -R $(whoami) /opt/homebrew/lib/node_modules
sudo chown -R $(whoami) /opt/homebrew/bin
sudo chown -R $(whoami) /opt/homebrew/share

# 2. Fix npm cache permissions
echo "2. Fixing npm cache..."
npm cache clean --force
npm config set cache ~/.npm

# 3. Fix global npm permissions
echo "3. Fixing npm global modules..."
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.npm-global

# 4. Alternative: Use nvm if available
echo "4. Checking for nvm..."
if command -v nvm &> /dev/null; then
    echo "nvm found - using it instead"
    nvm use stable
    npm cache clean --force
else
    echo "nvm not found - consider installing it for better Node management"
fi

# 5. Test npm
echo "5. Testing npm..."
npm --version
node --version

echo "✅ Permission fixes applied. Try 'npm run dev:alt' now."
