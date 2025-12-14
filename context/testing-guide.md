# Testing Guide - VibeCode Audit API

## Current Status
✅ **Build**: SUCCESS  
✅ **Deploy**: SUCCESS  
✅ **App Running**: YES  
⚠️ **Needs**: Environment Variables

---

## Step 1: Add Environment Variables (Railway Dashboard)

### Open Railway Dashboard:
```bash
open https://railway.com/project/805acb24-68a8-4047-83de-6e12a4d0e66a
```

### Add Variables to `vibecode-audit` service:
1. Click **vibecode-audit** service
2. Go to **Variables** tab
3. Click **"+ Reference Variable"** → Select **Redis** service → Choose `REDIS_URL`
4. Click **"+ New Variable"** → Add:
   - Name: `GROQ_API_KEY`
   - Value: `<your-groq-api-key>`
5. App will auto-restart (~10s)

---

## Step 2: Verify Deployment

### Check Logs:
```bash
railway logs --service vibecode-audit --tail 30
```

**Expected**: `API server running on port 3001`

### Get Public URL:
```bash
railway domain --service vibecode-audit
```

---

## Step 3: Test API Endpoints

### Health Check:
```bash
# Replace YOUR_DOMAIN with actual Railway domain
curl https://YOUR_DOMAIN/api/health
```

**Expected Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

### Test Scan Endpoint:
```bash
curl -X POST https://YOUR_DOMAIN/api/trpc/scan.start \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

**Expected**: Job ID returned

### Check Report:
```bash
# Use job ID from above
curl https://YOUR_DOMAIN/api/report/{jobId}
```

---

## Step 4: Local Testing (Optional)

### Run locally with Railway Redis:
```bash
# Set env vars
export REDIS_URL=$(railway variables --service Redis | grep REDIS_URL | awk '{print $3}')
export GROQ_API_KEY=<your-groq-api-key>

# Start server
npm start
```

### Test locally:
```bash
curl http://localhost:3001/api/health
```

---

## Common Issues

### "Cannot connect to Redis"
- Verify REDIS_URL is set in Railway variables
- Check Redis service is running

### "Invalid GROQ API key"
- Verify GROQ_API_KEY is set correctly
- Check key is active at console.groq.com

### App won't start
```bash
railway logs --service vibecode-audit --tail 100
```

---

## Next Steps After Working:

1. **Add custom domain** (Railway Settings → Domains)
2. **Setup monitoring** (Railway Metrics tab)
3. **Configure web frontend** (packages/web - separate deploy)
4. **Add rate limiting** (already implemented, just verify)
5. **Production secrets** (rotate API keys, use Railway secrets)

