# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client BEFORE compiling TypeScript
# DATABASE_URL dummy is only needed so prisma.config.ts can parse during generate
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate

RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and Prisma artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY prisma.config.ts ./

# Entrypoint: run migrations then start the server
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Run as non-root user
RUN addgroup -S app && adduser -S app -G app \
    && mkdir -p logs uploads/avatars uploads/logos \
    && chown -R app:app /app
USER app

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["./docker-entrypoint.sh"]
