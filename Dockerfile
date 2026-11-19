FROM node:22-alpine AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `npm run build` sudah menjalankan `prisma generate`.
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

LABEL org.opencontainers.image.title="waspadain" \
  org.opencontainers.image.description="Aplikasi latihan anti-modus penipuan digital" \
  org.opencontainers.image.source="https://github.com/lrcims/waspadain"

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Next.js menulis cache runtime di .next/cache; pastikan tetap bisa ditulis
# meskipun container dijalankan sebagai user non-root. Folder backups dipakai
# volume bernama untuk menyimpan backup JSON hasil reset akun.
RUN mkdir -p /app/.next/cache /app/backups \
  && chown -R nextjs:nodejs /app/.next /app/backups

USER nextjs
EXPOSE 3000
STOPSIGNAL SIGTERM

# Saat boot: jalankan migrasi, seed katalog (idempoten), lalu server.
# `exec` membuat Next.js menerima sinyal SIGTERM langsung dari Docker.
# Seed demo dan bootstrap admin tetap merupakan langkah manual.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed:catalog && exec npm start"]
