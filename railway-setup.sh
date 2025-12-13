#!/bin/bash
# Railway deployment for VibeCode Audit
set -e

echo "🚂 Railway Deployment Guide"
echo ""

# Check if logged in
if ! railway whoami &>/dev/null; then
  echo "Step 1: Login to Railway"
  railway login
  echo ""
fi

# Check project link
if ! railway status &>/dev/null 2>&1; then
  echo "Step 2: Link to Railway project (already created: vibecode-audit)"
  echo "Run: railway link"
  echo "Select: vibecode-audit"
  railway link
  echo ""
fi

echo "✅ Setup Steps:"
echo ""
echo "1. Add Redis via Railway Dashboard:"
echo "   → Go to: https://railway.com/project/805acb24-68a8-4047-83de-6e12a4d0e66a"
echo "   → Click '+ New' → 'Database' → 'Add Redis'"
echo "   → Railway auto-sets REDIS_URL env var"
echo ""
echo "2. Set Environment Variables:"
echo "   → In Railway dashboard → Variables tab"
echo "   → Add: GROQ_API_KEY=<your-key>"
echo "   → REDIS_URL will auto-populate from Redis service"
echo ""
echo "3. Deploy:"
railway up --detach
echo ""
echo "✅ Deployment initiated!"
echo "Monitor: https://railway.com/project/805acb24-68a8-4047-83de-6e12a4d0e66a"
echo ""
echo "Get domain: railway domain"


