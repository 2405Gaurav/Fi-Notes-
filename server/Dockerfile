# ─── Stage 1: Build ──────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate --schema=prisma/schema.prisma

COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# ─── Stage 2: Production ────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate --schema=prisma/schema.prisma

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]