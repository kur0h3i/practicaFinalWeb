# ── Stage 1: dependencies ─────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nodeapp

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN mkdir -p uploads && chown nodeapp:nodejs uploads

USER nodeapp

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "src/index.js"]
