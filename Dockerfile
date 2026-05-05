FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies only from package.json
COPY package.json package-lock.json* ./

# Copy all files
COPY . .

# Generate Prisma Client (requires DATABASE_URL, set dummy if not available)
RUN if [ -z "$DATABASE_URL" ]; then \
      echo "DATABASE_URL not set, using dummy for build"; \
      DATABASE_URL="postgresql://user:password@localhost:5432/db" npx prisma generate; \
    else \
      npx prisma generate; \
    fi

# Expose the port your app runs on
EXPOSE 3000 

# Run the app using the start script
CMD [ "npm", "run", "start" ]