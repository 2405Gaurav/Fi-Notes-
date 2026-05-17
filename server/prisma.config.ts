import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const datasourceUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!datasourceUrl) {
  throw new Error('Missing DATABASE_URL (or DIRECT_URL) for Prisma config')
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: datasourceUrl,
  },
})
