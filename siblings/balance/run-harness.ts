import { writeFileSync } from "node:fs";
import { formatHarnessMarkdown, runHarness } from "./harness.ts";

const duration = Number(process.env.HARNESS_DURATION ?? 900);
const summary = runHarness(duration);
const md = formatHarnessMarkdown(summary);

const outPath = process.env.HARNESS_OUT ?? new URL("../harness-results.md", import.meta.url).pathname;
writeFileSync(outPath, md, "utf8");
console.log(md);
console.log(`\nWrote ${outPath}`);

if (summary.risks.some((r) => r.startsWith("INFINITE LOOP"))) {
  process.exitCode = 2;
}
