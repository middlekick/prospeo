-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "stripe_customer_id" TEXT,
    "stripe_sub_id" TEXT,
    "stripe_status" TEXT,
    "current_period_end" TIMESTAMP(3),
    "scrape_count" INTEGER NOT NULL DEFAULT 0,
    "scrape_reset_at" TIMESTAMP(3),
    "db_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "db_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_user_id_key" ON "Subscription"("user_id");
