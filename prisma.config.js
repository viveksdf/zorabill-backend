import { defineConfig } from '@prisma/config';
import { config } from "./src/config/env.js";

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: "postgresql://vyaparadmin:Vyap@r123@localhost:5432/vyaparbook?schema=public",
  },
  migrations: {
    directory: './prisma/migrations',
    seed: "node ./prisma/seed.js"
  },
});