# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy the rest of the application code
COPY . .

# Expose no ports (stdio service)
# If you want to expose a port, uncomment the next line
EXPOSE 8089

# Use environment variables from the host or --env-file
# Do NOT copy .env for security

# Set the default command to run the MCP server
CMD ["node", "server.js"]
