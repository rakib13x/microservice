FROM node:23.10.0-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Install dependencies with legacy peer deps to handle React version conflicts
RUN npm install --legacy-peer-deps

# Copy the entire project
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose ports for all services
EXPOSE 3000 3001 3002 6001 6002 6003 6004 6005 6006 6007 8080

# Default command (can be overridden)
CMD ["npm", "run", "dev"]