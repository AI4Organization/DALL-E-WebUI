# ============ Stage 1: Dependencies ============
FROM node:24-slim AS deps
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# ============ Stage 2: Builder ============
FROM node:24-slim AS builder
WORKDIR /usr/src/app

# Copy dependencies from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ============ Stage 3: Production Runner ============
FROM node:24-slim AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /usr/src/app/.next/standalone ./
COPY --from=builder /usr/src/app/.next/static ./.next/static
COPY --from=builder /usr/src/app/public ./public

# Set ownership to non-root user
RUN chown -R nextjs:nodejs /usr/src/app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
