import { $ } from "bun"
import path from "path"

const rootPkgPath = path.resolve(import.meta.dir, "../../../package.json")
const rootPkg = await Bun.file(rootPkgPath).json()

// Read the opencode package.json for version info (separate from root package.json)
const opencodePkgPath = path.resolve(import.meta.dir, "../../opencode/package.json")
const opencodePkg = await Bun.file(opencodePkgPath).json()

// Fork version tracking - combines upstream version with fork modifications
const forkVersionPath = path.resolve(import.meta.dir, "../../../fork-version.json")
const forkVersion = await Bun.file(forkVersionPath)
  .json()
  .catch(() => null) as { version: number; name: string } | null
const expectedBunVersion = rootPkg.packageManager?.split("@")[1]

if (!expectedBunVersion) {
  throw new Error("packageManager field not found in root package.json")
}

if (process.versions.bun !== expectedBunVersion) {
  throw new Error(`This script requires bun@${expectedBunVersion}, but you are using bun@${process.versions.bun}`)
}

const env = {
  OPENCODE_CHANNEL: process.env["OPENCODE_CHANNEL"],
  OPENCODE_BUMP: process.env["OPENCODE_BUMP"],
  OPENCODE_VERSION: process.env["OPENCODE_VERSION"],
}
const CHANNEL = await (async () => {
  if (env.OPENCODE_CHANNEL) return env.OPENCODE_CHANNEL
  if (env.OPENCODE_BUMP) return "latest"
  if (env.OPENCODE_VERSION && !env.OPENCODE_VERSION.startsWith("0.0.0-")) return "latest"
  return await $`git branch --show-current`.text().then((x) => x.trim())
})()
const IS_PREVIEW = CHANNEL !== "latest"

// Get the upstream version from opencode's package.json (updated by GHA merge workflow)
const UPSTREAM_VERSION = opencodePkg.version as string

const VERSION = await (async () => {
  if (env.OPENCODE_VERSION) return env.OPENCODE_VERSION

  // For fork builds, use package.json version + fork suffix
  // This takes priority over preview builds so local dev works correctly
  if (forkVersion) {
    return `${UPSTREAM_VERSION}+${forkVersion.name}.${forkVersion.version}`
  }

  if (IS_PREVIEW) return `0.0.0-${CHANNEL}-${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "")}`

  // Original upstream logic for non-fork builds
  const version = await fetch("https://registry.npmjs.org/opencode-ai/latest")
    .then((res) => {
      if (!res.ok) throw new Error(res.statusText)
      return res.json()
    })
    .then((data: any) => data.version)
  const [major, minor, patch] = version.split(".").map((x: string) => Number(x) || 0)
  const t = env.OPENCODE_BUMP?.toLowerCase()
  if (t === "major") return `${major + 1}.0.0`
  if (t === "minor") return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
})()

export const Script = {
  get channel() {
    return CHANNEL
  },
  get version() {
    return VERSION
  },
  get upstreamVersion() {
    return UPSTREAM_VERSION
  },
  get forkVersion() {
    return forkVersion?.version ?? null
  },
  get preview() {
    return IS_PREVIEW
  },
}
console.log(`opencode script`, JSON.stringify(Script, null, 2))
