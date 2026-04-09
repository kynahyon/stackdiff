# stackdiff

> CLI tool to compare and visualize dependency changes between package.json lockfile versions

## Installation

```bash
npm install -g stackdiff
```

## Usage

Run `stackdiff` in any project directory to compare lockfile versions:

```bash
# Compare current lockfile against the last git commit
stackdiff

# Compare two specific lockfile versions
stackdiff --from package-lock.json --to package-lock.json.bak

# Output diff as JSON
stackdiff --format json

# Filter to only show packages matching a pattern
stackdiff --filter express
```

**Example output:**

```
+ lodash        4.17.20  →  4.17.21   (patch)
+ express       4.18.1   →  4.19.2    (minor)
- debug         4.3.3    removed
~ typescript    5.0.4    →  5.4.5     (minor)

3 updated · 1 removed · 0 added
```

## Options

| Flag | Description |
|------|-------------|
| `--from <file>` | Path to the base lockfile |
| `--to <file>` | Path to the target lockfile |
| `--format` | Output format: `pretty` (default) or `json` |
| `--depth` | Limit to top-level dependencies only (`--depth 1`) |
| `--filter <pattern>` | Only show packages whose name matches the given string or regex |

## Requirements

- Node.js >= 16
- A `package-lock.json` or `yarn.lock` file in the target directory

## License

MIT © [stackdiff contributors](https://github.com/stackdiff/stackdiff)
