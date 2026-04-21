# Hoisting Analysis

The `hoisting` analyzer inspects a lockfile to determine how packages are resolved
and whether version conflicts exist that prevent full hoisting.

## Concepts

- **Hoisted**: A package shared by multiple consumers and resolved to a single top-level version.
- **Nested**: A package required by only one consumer, installed locally.
- **Conflicted**: A package where multiple incompatible versions are required, resulting in duplicate installs.

## Usage

```bash
stackdiff hoisting package-lock.json
stackdiff hoisting --format json
stackdiff hoisting --all
```

## Options

| Flag | Description |
|------|-------------|
| `--lockfile`, `-l` | Path to the lockfile (default: `package-lock.json`) |
| `--format` | Output format: `text` (default) or `json` |
| `--all` | Show all packages, not just conflicts |

## Output Example

```
Hoisting Analysis
  Hoisted:    12
  Nested:     5
  Conflicted: 2

Conflicts:
  react@17.0.2 (also: 18.2.0)
  semver@6.3.0 (also: 7.5.4)
```

## JSON Output

When `--format json` is used, the full `HoistReport` object is emitted, including
per-entry `requiredBy` arrays useful for tracing which packages introduced conflicts.
