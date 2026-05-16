-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL DEFAULT '',
    "metier" TEXT NOT NULL DEFAULT '',
    "telephone" TEXT NOT NULL DEFAULT '',
    "site" TEXT NOT NULL DEFAULT '',
    "emplacement" TEXT NOT NULL DEFAULT '',
    "pays" TEXT NOT NULL DEFAULT 'France',
    "tag" TEXT NOT NULL DEFAULT 'non_appele',
    "rappel" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TEXT NOT NULL DEFAULT '',
    "contacted_at" TEXT NOT NULL DEFAULT '',
    "ads_prenom" TEXT NOT NULL DEFAULT '',
    "ads_nomclient" TEXT NOT NULL DEFAULT '',
    "ads_entreprise" TEXT NOT NULL DEFAULT '',
    "ads_tel" TEXT NOT NULL DEFAULT '',
    "ads_email" TEXT NOT NULL DEFAULT '',
    "ads_zone" TEXT NOT NULL DEFAULT '',
    "ads_rayon" TEXT NOT NULL DEFAULT '',
    "ads_statut" TEXT NOT NULL DEFAULT '',
    "ads_budget" TEXT NOT NULL DEFAULT '',
    "ads_type" TEXT NOT NULL DEFAULT '',
    "ads_services" JSONB NOT NULL DEFAULT '[]',
    "ads_notes" TEXT NOT NULL DEFAULT '',
    "rdv_date" TEXT NOT NULL DEFAULT '',
    "rdv_heure" TEXT NOT NULL DEFAULT '',
    "rdv_statut" TEXT NOT NULL DEFAULT '',
    "rdv_lieu" TEXT NOT NULL DEFAULT '',
    "rdv_notes" TEXT NOT NULL DEFAULT '',
    "activities" JSONB NOT NULL DEFAULT '[]',
    "db_created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "db_updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_user_id_idx" ON "Lead"("user_id");
