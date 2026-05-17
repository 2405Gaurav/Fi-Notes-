# ─── Stage 1: Build ──────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN ls -la generated/prisma

RUN npm run build


# ─── Stage 2: Production ────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev

COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npx prisma generate

COPY --from=builder /app/generated ./generated
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]