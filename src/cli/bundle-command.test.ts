import { parseBundleArgs } from "./bundle-command";

describe("parseBundleArgs", () => {
  it("returns defaults when no args provided", () => {
    const args = parseBundleArgs([]);
    expect(args.lockfile).toBe("package-lock.json");
    expect(args.format).toBe("text");
    expect(args.top).toBe(5);
  });

  it("parses --lockfile flag", () => {
    const args = parseBundleArgs(["--lockfile", "yarn.lock"]);
    expect(args.lockfile).toBe("yarn.lock");
  });

  it("parses -l shorthand", () => {
    const args = parseBundleArgs(["-l", "custom.lock"]);
    expect(args.lockfile).toBe("custom.lock");
  });

  it("parses --format json", () => {
    const args = parseBundleArgs(["--format", "json"]);
    expect(args.format).toBe("json");
  });

  it("ignores invalid format values", () => {
    const args = parseBundleArgs(["--format", "xml"]);
    expect(args.format).toBe("text");
  });

  it("parses --top flag", () => {
    const args = parseBundleArgs(["--top", "10"]);
    expect(args.top).toBe(10);
  });

  it("ignores non-numeric --top value", () => {
    const args = parseBundleArgs(["--top", "abc"]);
    expect(args.top).toBe(5);
  });

  it("treats positional arg as lockfile", () => {
    const args = parseBundleArgs(["my-lock.json"]);
    expect(args.lockfile).toBe("my-lock.json");
  });
});
