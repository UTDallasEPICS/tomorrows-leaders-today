# syntax=docker/dockerfile:1.7
# Multi-stage build for a small, production-ready Next.js image.

# install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy dependency manifests first for better layer caching
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./
COPY prisma ./prisma/

# Install whichever package manager you're using
RUN \
    if [ -f pnpm-lock.yaml ]; then \
    npm install -g pnpm && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else echo "No lockfile found!" && exit 1; \
    fi

# build the app
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client + build Next.js with standalone output
RUN npx prisma generate
RUN \
    if [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm build; \
    elif [ -f yarn.lock ]; then yarn build; \
    else npm run build; \
    fi

# production runtime
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static

# Prisma needs the generated client and schema at runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000

# Cloud Run sets PORT — Next.js standalone respects it
CMD ["node", "server.js"]