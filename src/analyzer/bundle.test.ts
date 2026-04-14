import {
  estimateBundleSize,
  analyzeBundleImpact,
  formatBundleReport,
} from "./bundle";

describe("estimateBundleSize", () => {
  it("returns known size for react", () => {
    const entry = estimateBundleSize("react", "18.0.0");
    expect(entry.name).toBe("react");
    expect(entry.estimatedKB).toBe(6.4);
    expect(entry.treeshakable).toBe(false);
  });

  it("returns default size for unknown package", () => {
    const entry = estimateBundleSize("unknown-pkg", "1.0.0");
    expect(entry.estimatedKB).toBe(20);
    expect(entry.gzippedKB).toBeCloseTo(6, 0);
  });

  it("marks lodash-es as tree-shakable", () => {
    const entry = estimateBundleSize("lodash-es", "4.17.21");
    expect(entry.treeshakable).toBe(true);
  });
});

describe("analyzeBundleImpact", () => {
  const deps = {
    react: "18.0.0",
    "react-dom": "18.0.0",
    dayjs: "1.11.0",
  };

  it("sums total size correctly", () => {
    const result = analyzeBundleImpact(deps);
    expect(result.totalKB).toBeGreaterThan(0);
    expect(result.entries).toHaveLength(3);
  });

  it("sorts largest packages descending", () => {
    const result = analyzeBundleImpact(deps);
    expect(result.largestPackages[0].name).toBe("react-dom");
  });

  it("counts treeshakable packages", () => {
    const result = analyzeBundleImpact({ "lodash-es": "4.17.21", dayjs: "1.11.0" });
    expect(result.treeshakableCount).toBe(2);
  });

  it("returns empty analysis for no deps", () => {
    const result = analyzeBundleImpact({});
    expect(result.totalKB).toBe(0);
    expect(result.entries).toHaveLength(0);
  });
});

describe("formatBundleReport", () => {
  it("includes total size in output", () => {
    const analysis = analyzeBundleImpact({ react: "18.0.0" });
    const report = formatBundleReport(analysis);
    expect(report).toContain("Bundle Impact Analysis");
    expect(report).toContain("KB");
  });

  it("lists largest packages", () => {
    const analysis = analyzeBundleImpact({ lodash: "4.17.21" });
    const report = formatBundleReport(analysis);
    expect(report).toContain("lodash");
    expect(report).toContain("Largest Packages");
  });
});
