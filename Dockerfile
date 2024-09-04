# Use an official Node.js image as the base image
FROM node:16

# Install Python and pip to install Semgrep
RUN apt-get update && \
    apt-get install -y python3 python3-pip

# Install Semgrep via pip
RUN pip3 install semgrep

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npx", "ts-node", "src/index.ts"]
