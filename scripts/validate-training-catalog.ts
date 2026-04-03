/**
 * Validates every opening key referenced in the recommendation catalog
 * plus every key in trainingCatalog. Exits 1 if structural lesson issues exist.
 *
 * Run: npx tsx scripts/validate-training-catalog.ts
 */
import { openingCatalog } from "../data/openings";
import { getTrainingTrack, trainingCatalog, validateTrainingTrack } from "../data/training";

function collectOpeningKeys(): Set<string> {
  const keys = new Set<string>();
  for (const o of openingCatalog.white) keys.add(o.key);
  for (const o of openingCatalog.blackE4) keys.add(o.key);
  for (const o of openingCatalog.blackD4) keys.add(o.key);
  return keys;
}

function main() {
  const fromOpenings = collectOpeningKeys();
  const fromCatalog = new Set(Object.keys(trainingCatalog));
  const allKeys = new Set<string>([...fromOpenings, ...fromCatalog]);

  const allIssues = [...allKeys].sort().flatMap((key) => validateTrainingTrack(key, getTrainingTrack(key)));

  if (allIssues.length) {
    console.error("[validate-training-catalog] FAILED:\n" + allIssues.join("\n"));
    process.exit(1);
  }

  console.log(`[validate-training-catalog] OK (${allKeys.size} opening keys checked).`);
}

main();
