FROM base AS builder
WORKDIR /app
COPY apps/seller-ui ./apps/seller-ui
RUN npx nx build seller-ui

FROM node:23.10.0-alpine AS production
WORKDIR /app
RUN npm install next@15.1.4 react@19.0.0 react-dom@19.0.0 --only=production
COPY --from=builder /app/dist/apps/seller-ui ./
COPY --from=base /app/packages ./packages

EXPOSE 3001
CMD ["npm", "start"]
