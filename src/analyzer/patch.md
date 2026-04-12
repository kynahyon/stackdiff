# Patch Analysis Module

The `patch` analyzer classifies dependency updates by their semver change type (patch, minor, or major) and helps identify which updates are safe to apply automatically.

## Functions

### `classifyPatchChange(from, to)`
Returns an object indicating whether the version bump is a patch, minor, or major change.

### `countPatchDistance(from, to)`
Returns the numeric difference between patch version numbers.

### `analyzePatchChanges(diff)`
Accepts a `DiffResult[]` array and returns a `PatchSummary` containing:
- `patches` — all updated entries with classification metadata
- `totalPatches` / `totalMinor` / `totalMajor` — counts per type
- `safeToAutoUpdate` — package names that only changed at the patch level

### `formatPatchReport(summary)`
Formats the `PatchSummary` as a human-readable Markdown string.

## CLI Usage

```bash
stackdiff patch <old-lockfile> <new-lockfile> [--format text|json] [--patch-only]
```

| Flag | Description |
|------|-------------|
| `--format` | Output format: `text` (default) or `json` |
| `--patch-only` | Show only patch-level changes |

## Example Output

```
## Patch Analysis

- Patch updates: 3
- Minor updates: 1
- Major updates: 0

### Safe to auto-update (patch only):
  - lodash
  - chalk
  - semver

### All version changes:
  [PATCH] lodash: 4.17.20 → 4.17.21
  [MINOR] axios: 0.21.0 → 0.22.0
```
