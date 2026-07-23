-- AlterTable: adiciona campos de frete e migra pedidos existentes
ALTER TABLE "Order"
  ADD COLUMN "shippingCarrier" TEXT,
  ADD COLUMN "shippingEstimatedDays" INTEGER,
  ADD COLUMN "shippingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "subtotalPrice" INTEGER;

UPDATE "Order"
SET "subtotalPrice" = "totalPrice"::INTEGER
WHERE "subtotalPrice" IS NULL;

ALTER TABLE "Order"
  ALTER COLUMN "subtotalPrice" SET NOT NULL;

ALTER TABLE "Order"
  ALTER COLUMN "totalPrice" SET DATA TYPE DOUBLE PRECISION USING "totalPrice"::DOUBLE PRECISION;
