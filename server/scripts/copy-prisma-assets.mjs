import { cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");

const sourceDir = resolve(projectRoot, "src/generated/prisma");
const targetDir = resolve(projectRoot, "dist/src/generated/prisma");

mkdirSync(targetDir, { recursive: true });

for (const fileName of ["package.json", "query_compiler_fast_bg.wasm"]) {
  const sourcePath = resolve(sourceDir, fileName);
  const targetPath = resolve(targetDir, fileName);

  if (existsSync(sourcePath) && !existsSync(targetPath)) {
    cpSync(sourcePath, targetPath);
  }
}
