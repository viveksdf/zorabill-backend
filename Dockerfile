FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Copy Prisma schema
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npm run prisma:generate

# Copy application code
COPY . .

# Expose the port
EXPOSE 3000

# Run the app
CMD ["npm", "run", "start"]