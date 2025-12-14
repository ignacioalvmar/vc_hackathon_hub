import { config } from 'dotenv'
config() // Load .env file

import { defineConfig, env } from 'prisma/config'

export default defineConfig({
    schema: 'prisma/schema.prisma',
    datasource: {
        // Use DIRECT_URL for migrations (required for Supabase), fallback to DATABASE_URL
        url: env('DIRECT_URL') || env('DATABASE_URL'),
    },
})
