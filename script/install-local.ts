#!/usr/bin/env bun
/**
 * Build and install opencode locally
 *
 * Usage:
 *   bun run script/install-local.ts
 *   bun run script/install-local.ts --bump  # Increment fork version before building
 *
 * Installs to ~/.local/bin/opencode (or creates it if it doesn't exist)
 */

import { $ } from "bun"
import path from "path"
import fs from "fs/promises"
import os from "os"

const rootDir = path.resolve(import.meta.dir, "..")
const forkVersionPath = path.join(rootDir, "fork-version.json")
const installDir = path.join(os.homedir(), ".local", "bin")

const shouldBump = process.argv.includes("--bump")

// Ensure install directory exists
await fs.mkdir(installDir, { recursive: true })

// Optionally bump fork version
if (shouldBump) {
  const forkVersion = await Bun.file(forkVersionPath).json()
  forkVersion.version++
  await Bun.write(forkVersionPath, JSON.stringify(forkVersion, null, 2) + "\n")
  console.log(`Bumped fork version to ${forkVersion.version}`)
}

// Build for current platform
console.log("Building opencode for current platform...")
process.chdir(path.join(rootDir, "packages/opencode"))
await $`bun run ./script/build.ts --single`

// Find the built binary
const platform = process.platform
const arch = process.arch
const distDir = path.join(rootDir, "packages/opencode/dist")

const dirs = await fs.readdir(distDir)
const matchingDir = dirs.find((d) => d.includes(platform) && d.includes(arch) && !d.includes("baseline"))

if (!matchingDir) {
  console.error(`Could not find build for ${platform}-${arch}`)
  process.exit(1)
}

const binaryName = platform === "win32" ? "opencode.exe" : "opencode"
const sourcePath = path.join(distDir, matchingDir, "bin", binaryName)
const destPath = path.join(installDir, binaryName)

// Copy binary
await fs.copyFile(sourcePath, destPath)
await fs.chmod(destPath, 0o755)

// Get version info
const forkVersion = await Bun.file(forkVersionPath).json()
const pkgVersion = (await Bun.file(path.join(rootDir, "packages/opencode/package.json")).json()).version

console.log(`\nInstalled opencode to ${destPath}`)
console.log(`Version: ${pkgVersion}+${forkVersion.name}.${forkVersion.version}`)
console.log(`\nMake sure ${installDir} is in your PATH`)
