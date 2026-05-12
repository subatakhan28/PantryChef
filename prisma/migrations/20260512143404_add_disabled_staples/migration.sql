-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "disabled_staples" TEXT[] DEFAULT ARRAY[]::TEXT[];
