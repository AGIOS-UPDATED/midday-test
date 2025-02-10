FROM oven/bun:1.1.38 as builder

WORKDIR /app

# Copy root package.json and workspace files
COPY package.json .
COPY bun.lockb .
COPY turbo.json .
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install dependencies
RUN bun install

# Build the dashboard app
RUN bun run build:dashboard

# Production image
FROM oven/bun:1.1.38-slim

WORKDIR /app

# Copy built assets from builder
COPY --from=builder /app/apps/dashboard/.next ./.next
COPY --from=builder /app/apps/dashboard/public ./public
COPY --from=builder /app/apps/dashboard/package.json .
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["bun", "run", "start"]
