import { config } from 'dotenv'
config() // Load .env file

import { defineConfig } from 'prisma/config'

export default defineConfig({
    schema: 'prisma/schema.prisma',
})
