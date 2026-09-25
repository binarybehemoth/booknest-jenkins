# syntax=docker/dockerfile:1
# BookNest API. Targets: test (runs the suite) and runtime (the default, last stage).
ARG NODE_IMAGE=node:24-slim

FROM --platform=$BUILDPLATFORM ${NODE_IMAGE} AS base
WORKDIR /app
COPY package.json package-lock.json ./

# npm's downloads live in a cache mount; an optional "npmrc" secret can carry a token.
FROM base AS deps
RUN --mount=type=cache,target=/root/.npm --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci --omit=dev --no-audit --no-fund

# All dependencies plus the tests; run it next to PostgreSQL. Nothing ships from here.
FROM base AS test
RUN --mount=type=cache,target=/root/.npm --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci --no-audit --no-fund
COPY . .
ENV NODE_ENV=test
USER 1000:1000
CMD ["npm", "test"]

# The production image: runtime files only, unprivileged UID 1000.
FROM ${NODE_IMAGE} AS runtime
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV} PORT=3000
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json app.js server.js ./
COPY db ./db
COPY public ./public
USER 1000:1000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", \
  "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]
CMD ["node", "server.js"]
