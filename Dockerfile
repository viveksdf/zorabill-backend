FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only from package.json
COPY package.json package-lock.json* ./

COPY prisma ./prisma/

# Copy all files
COPY . .

# Generate Prisma Client
RUN npm run prisma:generate

# Expose the port your app runs on
EXPOSE 3000 

# Run the app using the start script
CMD [ "npm", "run", "start" ]