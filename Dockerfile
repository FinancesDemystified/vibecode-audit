FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@8.15.0

FROM base AS builder
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json ./
COPY packages ./packages
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @vibecode-audit/shared build || (echo "Shared build failed" && exit 1)
RUN pnpm --filter @vibecode-audit/agents build || (echo "Agents build failed" && exit 1)
RUN pnpm --filter @vibecode-audit/api build || (echo "API build failed" && exit 1)

FROM base AS runner
WORKDIR /app/packages/api
ENV NODE_ENV=production
COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/packages/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ../shared/dist
COPY --from=builder /app/packages/agents/dist ../agents/dist

EXPOSE 3001
CMD ["node", "dist/server.js"]
