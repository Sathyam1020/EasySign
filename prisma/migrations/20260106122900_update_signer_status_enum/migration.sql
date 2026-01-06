-- Create the new enum type with the updated values
CREATE TYPE "SignerStatus_new" AS ENUM ('pending', 'seen', 'signed');

-- Add a temporary column with the new enum type
ALTER TABLE "Signer" ADD COLUMN "status_new" "SignerStatus_new" NOT NULL DEFAULT 'pending';

-- Copy data from old column to new column, converting 'draft' to 'pending'
UPDATE "Signer" SET "status_new" = CASE 
  WHEN "status"::text = 'draft' THEN 'pending'::text
  WHEN "status"::text = 'pending' THEN 'pending'::text
  WHEN "status"::text = 'signed' THEN 'signed'::text
  ELSE 'pending'::text
END::"SignerStatus_new";

-- Drop the old column
ALTER TABLE "Signer" DROP COLUMN "status";

-- Rename the new column to the original name
ALTER TABLE "Signer" RENAME COLUMN "status_new" TO "status";

-- Drop the old enum type
DROP TYPE "SignerStatus";

-- Rename the new enum type
ALTER TYPE "SignerStatus_new" RENAME TO "SignerStatus";
