import { analyzeBundleImpact, formatBundleReport } from "../analyzer/bundle";
import { readFile } from "./runner";

export interface BundleArgs {
  lockfile: string;
  format: "text" | "json";
  top: number;
}

export function parseBundleArgs(argv: string[]): BundleArgs {
  const args: BundleArgs = { lockfile: "package-lock.json", format: "text", top: 5 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if ((arg === "--lockfile" || arg === "-l") && argv[i + 1]) {
      args.lockfile = argv[++i];
    } else if (arg === "--format" && argv[i + 1]) {
      const fmt = argv[++i];
      if (fmt === "json" || fmt === "text") args.format = fmt;
    } else if (arg === "--top" && argv[i + 1]) {
      const n = parseInt(argv[++i], 10);
      if (!isNaN(n)) args.top = n;
    } else if (!arg.startsWith("-")) {
      args.lockfile = arg;
    }
  }
  return args;
}

export async function runBundleCommand(argv: string[]): Promise<void> {
  const args = parseBundleArgs(argv);
  const content = await readFile(args.lockfile);
  let deps: Record<string, string>;
  try {
    const parsed = JSON.parse(content);
    const packages = parsed.packages ?? parsed.dependencies ?? {};
    deps = {};
    for (const [key, val] of Object.entries(packages)) {
      const name = key.replace(/^node_modules\//, "");
      if (name && typeof (val as any).version === "string") {
        deps[name] = (val as any).version;
      }
    }
  } catch {
    console.error("Failed to parse lockfile");
    process.exit(1);
  }

  const analysis = analyzeBundleImpact(deps);

  if (args.format === "json") {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    console.log(formatBundleReport(analysis));
  }
}
