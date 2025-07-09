FROM base AS builder
WORKDIR /app
COPY apps/order-service ./apps/order-service
RUN npx nx build order-service

FROM node:23.10.0-alpine AS production
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 6003
CMD ["node", "dist/apps/order-service/main.js"]
