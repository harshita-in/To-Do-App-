FROM node:20-slim

# Set working directory
WORKDIR /app

# The 'node' user is pre-configured in the official node image with UID 1000.
# Ensure the app directory is owned by the node user.
RUN chown -R node:node /app

# Switch to the non-root node user
USER node

# Copy package files with correct ownership
COPY --chown=node:node package*.json ./

# Install production-only dependencies
RUN npm ci --only=production

# Copy the rest of the application files with correct ownership
COPY --chown=node:node . .

# Define environment variables
# Hugging Face Spaces expects the app to listen on port 7860.
ENV PORT=7860
ENV NODE_ENV=production

# Expose port 7860
EXPOSE 7860

# Start the application
CMD ["npm", "start"]
