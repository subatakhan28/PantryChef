import { PrismaClient } from "@prisma/client";
import { INGREDIENT_ALIASES } from "../lib/ingredients/aliases";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${INGREDIENT_ALIASES.length} ingredient aliases…`);

  let created = 0;
  let updated = 0;

  for (const row of INGREDIENT_ALIASES) {
    const result = await prisma.ingredientAlias.upsert({
      where: { alias: row.alias.toLowerCase() },
      update: { normalizedName: row.normalized },
      create: { alias: row.alias.toLowerCase(), normalizedName: row.normalized },
    });
    if (result.createdAt.getTime() > Date.now() - 1000) created++;
    else updated++;
  }

  console.log(`Done. Created ${created}, updated ${updated}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
