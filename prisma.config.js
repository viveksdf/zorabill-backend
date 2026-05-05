import { defineConfig } from '@prisma/config';
import { config } from "./src/config/env.js";

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: config.database.url,
  },
  migrations: {
    directory: './prisma/migrations',
    seed: "node ./prisma/seed.js"
  },
});