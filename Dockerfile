FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only from package.json and package-lock.json
COPY package.json ./

RUN npm install

# Copy all files
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Run the app using the start script
CMD [ "npm", "run", "start" ]