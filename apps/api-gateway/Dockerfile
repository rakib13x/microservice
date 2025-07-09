# Use the base image
FROM base as production

# Copy the specific service files
COPY apps/api-gateway ./apps/api-gateway
COPY packages ./packages
COPY prisma ./prisma

# Build the specific service
RUN npx nx build api-gateway

# Expose the port for this service
EXPOSE 8080

# Start the service
CMD ["node", "dist/apps/api-gateway/main.js"]