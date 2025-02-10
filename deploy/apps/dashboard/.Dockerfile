FROM oven/bun:1.1.38 as builder

WORKDIR /app

# Copy root package files
COPY package.json bun.lockb turbo.json ./

# Copy all workspace packages
COPY packages/ ./packages/

# Copy the dashboard app
COPY apps/dashboard/ ./apps/dashboard/

# Install dependencies
RUN bun install

# Build all required packages
RUN bun run build --filter=@midday/dashboard...

# Production image
FROM oven/bun:1.1.38-slim

WORKDIR /app

# Copy package files for production
COPY --from=builder /app/package.json /app/bun.lockb ./

# Copy built workspace packages
COPY --from=builder /app/packages ./packages

# Copy built dashboard app
COPY --from=builder /app/apps/dashboard/.next ./apps/dashboard/.next
COPY --from=builder /app/apps/dashboard/public ./apps/dashboard/public
COPY --from=builder /app/apps/dashboard/package.json ./apps/dashboard/
COPY --from=builder /app/apps/dashboard/next.config.js ./apps/dashboard/

# Install production dependencies
RUN cd apps/dashboard && bun install --production

WORKDIR /app/apps/dashboard

EXPOSE 3000

CMD ["bun", "run", "start"]
