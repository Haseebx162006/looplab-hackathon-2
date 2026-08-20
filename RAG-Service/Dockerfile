FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy tsconfig and source files
COPY tsconfig.json ./
COPY src/ ./src/

# Install devDependencies temporarily for compilation
RUN npm install --only=development && npm run build && npm prune --production

# Expose microservice port
EXPOSE 5002

# Run production build
CMD ["node", "dist/index.js"]
