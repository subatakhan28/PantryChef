/**
 * Recipe seed — placeholder.
 *
 * The full seed (100+ recipes across Pakistani, Indo-Chinese, Chinese,
 * Japanese, Italian, and Western comfort cuisines) lands in Phase 3, when
 * the matching engine is built and we can verify each recipe matches
 * sensibly against typical pantries.
 *
 * Until then, run `npm run db:seed:aliases` to populate the alias table,
 * which is all the matching engine needs to start.
 */
async function main() {
  console.log("Recipe seed runs in Phase 3. For now, seed aliases with:");
  console.log("  npm run db:seed:aliases");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
