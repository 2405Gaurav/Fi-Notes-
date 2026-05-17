import { constants } from 'node:fs'
import { access, cp, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const serverRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceDir = resolve(serverRoot, 'src/generated/prisma')
const destinationDir = resolve(serverRoot, 'dist/generated/prisma')

async function copyGeneratedClient() {
  await access(sourceDir, constants.R_OK)

  await rm(destinationDir, { recursive: true, force: true })
  await cp(sourceDir, destinationDir, { recursive: true })
}

copyGeneratedClient().catch((error) => {
  console.error('Failed to copy Prisma client into dist/generated/prisma.')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
