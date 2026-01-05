-- AlterTable
ALTER TABLE "SignatureField" ADD COLUMN     "alignment" TEXT NOT NULL DEFAULT 'left',
ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#000000',
ADD COLUMN     "fontFamily" TEXT NOT NULL DEFAULT 'Arial',
ADD COLUMN     "fontSize" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "placeholder" TEXT;
