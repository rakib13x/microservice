FROM base AS builder
WORKDIR /app
COPY apps/kafka-service ./apps/kafka-service
RUN npx nx build kafka-service

FROM node:23.10.0-alpine AS production
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 6007
CMD ["node", "dist/apps/kafka-service/main.js"]
