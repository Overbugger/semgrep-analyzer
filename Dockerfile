# Use Node.js base image
FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Expose port (if necessary)
EXPOSE 3000

# Start the compiled JavaScript app
CMD ["npm", "start"]
