# Use the specified Node.js version
FROM node:23.10.0-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies with legacy peer deps flag
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose ports
EXPOSE 8080 6001 6002 6003 6004 6005 6006 6007 6008 6009 3000 3001 3002

# Default command
CMD ["npm", "run", "dev"]