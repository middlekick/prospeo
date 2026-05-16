-- CreateTable
CREATE TABLE "AutoScrapeConfig" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "metier" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "pays" TEXT NOT NULL DEFAULT 'France',
    "nb_per_run" INTEGER NOT NULL DEFAULT 20,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "last_run_added" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutoScrapeConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AutoScrapeConfig_user_id_idx" ON "AutoScrapeConfig"("user_id");
