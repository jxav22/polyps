/**
 * CLI entry expected by older balance scripts / tip builds.
 * Re-exports the live sim harness API under legacy names.
 */
import {
  formatLiveMarkdown,
  runLiveHarness,
  runLivePathway,
} from "./live-harness.ts";

export const runHarness = runLiveHarness;
export const formatHarnessMarkdown = formatLiveMarkdown;
export { runLiveHarness, formatLiveMarkdown, runLivePathway };

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] &&
  /run-harness\.(ts|js)$/.test(process.argv[1].replace(/\\/g, "/"));

if (isMain) {
  const duration = Number(process.env.HARNESS_DURATION ?? 180);
  const summary = runLiveHarness(duration);
  console.log(formatLiveMarkdown(summary));
}
