# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (including devDependencies required for building)
RUN npm install

# Copy the rest of the application code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled code from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables (these can be overridden)
ENV NODE_ENV=production
ENV PORT=5000

# Run the application
CMD ["npm", "start"]
