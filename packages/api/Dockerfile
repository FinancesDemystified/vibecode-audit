FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

FROM base AS deps
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../turbo.json ../../
COPY ../../packages/shared/package.json ../../packages/shared/
COPY ../../packages/agents/package.json ../../packages/agents/
COPY package.json ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ../../turbo.json ../../
COPY ../../packages ./packages
RUN pnpm --filter @vibecode-audit/shared build && \
    pnpm --filter @vibecode-audit/agents build && \
    pnpm --filter @vibecode-audit/api build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/packages/api/dist ./dist
COPY --from=builder /app/packages/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/agents/dist ./packages/agents/dist

EXPOSE 3001
CMD ["node", "dist/server.js"]
