# Local Development Setup

## macOS Permission Issues

If you're getting `EPERM: operation not permitted` errors when running `npm run dev`, this is a macOS security restriction that prevents Node.js from accessing system resources.

## Why This Happens Now

This issue occurs because:
1. **Homebrew installation issues** - npm can't access files in `/opt/homebrew/lib/node_modules/`
2. **macOS security updates** - Recent macOS updates have tightened permissions
3. **Mixed package managers** - Using both npm and pnpm can cause permission conflicts

## Quick Fixes

### 1. Run Permission Fix Script
```bash
cd web
./fix-macos-permissions.sh
```

### 2. Try Different Port/Hostname Combination
```bash
cd web
npm run dev:alt  # Uses port 3001 and localhost
```

### 3. Use nvm (Recommended)
```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Then use it
nvm install node
nvm use node
cd web && npm install
npm run dev:alt
```

### 4. Disable macOS Firewall Temporarily
```bash
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
# Run your dev server, then re-enable:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate on
```

### 5. Manual Permission Fixes
```bash
# Fix Homebrew permissions
sudo chown -R $(whoami) /opt/homebrew/lib/node_modules
sudo chown -R $(whoami) /opt/homebrew/bin

# Fix npm cache
npm cache clean --force
sudo chown -R $(whoami) ~/.npm
```

## Alternative: Use VS Code Live Server

If Next.js dev server won't work, you can:

1. Build the project: `npm run build`
2. Serve statically: `npm run start`

## Alternative: Use Docker

If all else fails, run in Docker:

```bash
cd web
docker build -t vibecode-web .
docker run -p 3000:3000 vibecode-web
```

## Production Status

- ✅ **Production**: Working on Vercel (https://vibecode-audit.vercel.app)
- ✅ **Code**: Dependencies fixed, no module errors, lazy loading implemented
- ❌ **Local dev**: macOS permission issue preventing npm/Node access

## Why Production Works But Local Doesn't

**Vercel**: Has proper system permissions, managed Node.js environment, no macOS restrictions
**Local macOS**: Recent security updates restrict file and network access for certain processes
