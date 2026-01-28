# Production Dockerfile for Railway
FROM node:18-alpine

WORKDIR /app

# Copy package files for server
COPY server/package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy server code
COPY server/ ./

# Copy data files
COPY data/ ./data/

# Create directories for runtime data
RUN mkdir -p /app/progress /app/users

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
