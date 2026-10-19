# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Build de produção multi-stage para Next.js (output: standalone) + Prisma.
# ---------------------------------------------------------------------------

FROM node:20-alpine AS base
# libc6-compat + openssl: exigidos pelos engines do Prisma no Alpine.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ---- Dependências ----
FROM base AS deps
COPY package.json package-lock.json ./
# Schema precisa existir aqui porque o postinstall roda `prisma generate`.
COPY prisma ./prisma
RUN npm ci

# ---- Build ----
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Runner ----
# Imagem slim que só serve o app. As migrations são aplicadas por um serviço
# separado (ver "migrate" no docker-compose), que usa o stage "builder" com as
# dependências completas do Prisma CLI.
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Artefatos do Next (standalone já traz o mínimo de node_modules).
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma Client + engine de query (runtime). O standalone normalmente já os
# inclui; copiamos explicitamente para garantir.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
