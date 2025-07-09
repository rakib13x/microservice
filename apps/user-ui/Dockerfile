FROM base AS builder
WORKDIR /app
COPY apps/user-ui ./apps/user-ui
RUN npx nx build user-ui

FROM node:23.10.0-alpine AS production
WORKDIR /app
RUN npm install next@15.1.4 react@19.0.0 react-dom@19.0.0 --only=production
COPY --from=builder /app/dist/apps/user-ui ./
COPY --from=base /app/packages ./packages

EXPOSE 3000
CMD ["npm", "start"]
