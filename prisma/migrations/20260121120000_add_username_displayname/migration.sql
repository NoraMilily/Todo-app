-- Add username + displayName to User and backfill existing rows safely.
ALTER TABLE "User"
ADD COLUMN "username" TEXT,
ADD COLUMN "displayName" TEXT;

-- Backfill existing users:
-- - displayName defaults to local-part of email
-- - username defaults to a unique value based on email local-part + id suffix
UPDATE "User"
SET
  "displayName" = COALESCE("displayName", split_part("email", '@', 1)),
  "username" = COALESCE(
    "username",
    regexp_replace(split_part("email", '@', 1), '[^a-zA-Z0-9_]+', '_', 'g') || '_' || substr("id", 1, 6)
  )
WHERE "username" IS NULL OR "displayName" IS NULL;

-- Enforce required constraints.
ALTER TABLE "User"
ALTER COLUMN "username" SET NOT NULL,
ALTER COLUMN "displayName" SET NOT NULL;

-- Ensure username is unique.
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

