# syntax=docker/dockerfile:1

# ===========================================================================
# base — shared layer. debian-slim (not alpine): Prisma's engines want glibc
# + openssl.
# ===========================================================================
FROM node:20-bookworm-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production

# ===========================================================================
# deps — full install including devDependencies, needed by `next build`
# (typescript, @types/*, eslint-config-next).
# ===========================================================================
FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci

# ===========================================================================
# build — `prisma generate && next build`
# ===========================================================================
FROM deps AS build
ENV NODE_ENV=production

# NEXT_PUBLIC_APP_URL is inlined into the client bundle AND the edge middleware
# (CSRF origin check in middleware.ts) at build time. The final public URL must
# be known here — it cannot be changed at runtime without rebuilding.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Dummy connection string. Every page is `force-dynamic`, so the database is
# never queried during `next build`; this only satisfies module-load code in
# src/lib/prisma.ts. Never a real credential.
ARG DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV DATABASE_URL=${DATABASE_URL}

COPY . .
RUN npm run build

# ===========================================================================
# runtime — production node_modules + build output. Runs server.ts through
# ts-node (matches `npm start`); the same image runs `prisma migrate deploy`
# as the one-off migration task.
# ===========================================================================
FROM base AS runtime

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Regenerate the Prisma client against the production install. No DB connection
# is made by `generate`; the dummy URL just satisfies prisma.config.ts.
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate

COPY tsconfig.json tsconfig.server.json next.config.js server.ts ./
COPY src ./src
COPY --from=build /app/.next ./.next

RUN chown -R node:node /app
USER node

# Type errors are caught in CI, not at container boot.
ENV TS_NODE_PROJECT=tsconfig.server.json
ENV TS_NODE_TRANSPILE_ONLY=true
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Direct node invocation (not `npm start`) so ECS SIGTERM reaches the process.
CMD ["node", "-r", "ts-node/register", "-r", "tsconfig-paths/register", "server.ts"]
