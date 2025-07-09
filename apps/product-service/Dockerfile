FROM base AS builder
WORKDIR /app
COPY apps/product-service ./apps/product-service
RUN npx nx build product-service

FROM node:23.10.0-alpine AS production
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 6002
CMD ["node", "dist/apps/product-service/main.js"]
