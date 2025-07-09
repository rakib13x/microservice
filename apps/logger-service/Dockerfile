FROM base AS builder
WORKDIR /app
COPY apps/logger-service ./apps/logger-service
RUN npx nx build logger-service

FROM node:23.10.0-alpine AS production
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 6008
CMD ["node", "dist/apps/logger-service/main.js"]
