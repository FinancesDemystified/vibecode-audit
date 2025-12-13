# Simplification Plan

## Problem
Monorepo with workspace deps breaks Docker deployment. Over-engineered for a simple API.

## Solution: Merge into single package

### Structure (simplified):
```
src/
  server.ts          # Entry point
  lib/               # Redis, queue (from api)
  agents/            # Processing logic
  types.ts           # Schemas (from shared)
package.json         # Single deps list
Dockerfile           # Simple build
```

### Benefits:
- No workspace deps
- No symlink issues
- Single tsc build
- 50% less config
- Clear dependency tree

### Migration:
1. Merge packages/shared → src/types
2. Merge packages/agents → src/agents
3. Keep packages/api as src/
4. Update imports (remove @vibecode-audit/*)
5. Single package.json
6. Simple Dockerfile

Estimated: 15min, 200 LOC → 150 LOC

