# Use an official Node.js runtime as a parent image
FROM node:20-slim AS builder

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the client-side code
RUN npm run build

# --- Production Stage ---
FROM node:20-slim

WORKDIR /usr/src/app

# Only copy necessary files from the builder
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/index.js ./index.js

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the app
CMD [ "node", "index.js" ]
