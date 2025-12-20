# Fork Documentation

This is a personal fork of [opencode](https://github.com/sst/opencode) with custom modifications.

## Version Format

```
1.0.170+avellan.1
│       │       │
│       │       └── Fork version (incremented with each local change)
│       └────────── Fork name
└────────────────── Upstream version (from sst/opencode)
```

Check your version:
```bash
opencode --version
```

## Fork-Specific Features

### Large Tool Result Persistence
MCP tool results exceeding 100K characters are persisted to disk instead of filling context, preventing "prompt too long" errors.

Configure threshold via environment variable:
```bash
export OPENCODE_TOOL_RESULT_MAX_CHARS=50000  # More aggressive (default: 100000)
```

### Earlier Compaction Threshold
Trigger context compaction earlier to prevent overflow.

```bash
export OPENCODE_COMPACTION_THRESHOLD=0.7  # Compact at 70% capacity (default: ~80%)
```

## Building & Installing

### Install locally
```bash
bun run install-local
```
Builds for your platform and installs to `~/.local/bin/opencode`.

### Install with version bump
```bash
bun run install-local:bump
```
Increments the fork version in `fork-version.json`, then builds and installs.

### Manual build
```bash
cd packages/opencode
bun run ./script/build.ts --single
```

## Upstream Sync

The GitHub Action `.github/workflows/sync-upstream.yml` runs every 6 hours to:

1. Check for new upstream releases
2. Rebase the `dev` branch on the new release tag
3. Update `main` to match `dev`
4. Create a release with the combined version (e.g., `v1.0.171+avellan.1`)

If a rebase conflict occurs, manual intervention is needed.

### Manual sync
Trigger manually from GitHub Actions → "Sync with upstream releases" → Run workflow.

## Files

| File | Purpose |
|------|---------|
| `fork-version.json` | Tracks fork version and name |
| `script/install-local.ts` | Build and install script |
| `.github/workflows/sync-upstream.yml` | Automated upstream sync |
| `FORK.md` | This documentation |
