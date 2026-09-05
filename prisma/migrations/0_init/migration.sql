-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('verifier', 'operator');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING_VERIFIER', 'REJECTED_BY_VERIFIER', 'PENDING_OPERATOR', 'APPLIED_ON_CRS', 'APPLIED_ON_CSC', 'REJECTED_BY_OPERATOR', 'COMPLETED');

-- CreateTable
CREATE TABLE "cert_users" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "facility" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cert_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "application_number" TEXT NOT NULL,
    "facility" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING_VERIFIER',
    "certificate_url" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "child_details" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "adhar_number" TEXT,
    "weight" DOUBLE PRECISION,
    "delivery_attention" TEXT,
    "delivery_method" TEXT,
    "pregnancy_duration" INTEGER,
    "place_of_birth" TEXT NOT NULL,
    "birth_plot_number" TEXT,
    "birth_mohalla" TEXT,
    "birth_village" TEXT NOT NULL,
    "birth_ward_number" TEXT,
    "birth_sub_district" TEXT NOT NULL,
    "birth_district" TEXT NOT NULL,
    "birth_state" TEXT NOT NULL,
    "birth_pin_code" TEXT NOT NULL,

    CONSTRAINT "child_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_details" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "mother_name" TEXT NOT NULL,
    "mother_adhar" TEXT NOT NULL,
    "mother_mobile" TEXT NOT NULL,
    "mother_email" TEXT,
    "father_name" TEXT NOT NULL,
    "father_adhar" TEXT NOT NULL,
    "father_mobile" TEXT NOT NULL,
    "father_email" TEXT,
    "present_plot_number" TEXT,
    "present_mohalla" TEXT,
    "present_village" TEXT NOT NULL,
    "present_ward_number" TEXT,
    "present_sub_district" TEXT NOT NULL,
    "present_district" TEXT NOT NULL,
    "present_state" TEXT NOT NULL,
    "present_pin_code" TEXT NOT NULL,
    "perm_plot_number" TEXT,
    "perm_mohalla" TEXT,
    "perm_village" TEXT NOT NULL,
    "perm_ward_number" TEXT,
    "perm_sub_district" TEXT NOT NULL,
    "perm_district" TEXT NOT NULL,
    "perm_state" TEXT NOT NULL,
    "perm_pin_code" TEXT NOT NULL,

    CONSTRAINT "parent_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "informant_details" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "adhar_number" TEXT,
    "mobile_number" TEXT NOT NULL,
    "email" TEXT,
    "provided_information" BOOLEAN NOT NULL DEFAULT false,
    "informant_plot_number" TEXT,
    "informant_village" TEXT NOT NULL,
    "informant_ward_number" TEXT,
    "informant_sub_district" TEXT NOT NULL,
    "informant_district" TEXT NOT NULL,
    "informant_state" TEXT NOT NULL,
    "informant_pin_code" TEXT NOT NULL,
    "mother_city" TEXT NOT NULL,
    "mother_sub_district" TEXT NOT NULL,
    "mother_district" TEXT NOT NULL,
    "mother_state" TEXT NOT NULL,
    "mother_pin_code" TEXT NOT NULL,
    "mother_religion" TEXT NOT NULL,
    "father_religion" TEXT NOT NULL,
    "mother_literacy" TEXT,
    "father_literacy" TEXT,
    "mother_profession" TEXT,
    "father_profession" TEXT,
    "mother_age_at_marriage" INTEGER,
    "mother_age_at_child_birth" INTEGER,
    "mother_child_number" INTEGER,
    "relation_to_child" TEXT,
    "declaration_accepted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "informant_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cert_users_username_key" ON "cert_users"("username");

-- CreateIndex
CREATE INDEX "cert_users_username_idx" ON "cert_users"("username");

-- CreateIndex
CREATE INDEX "cert_users_facility_idx" ON "cert_users"("facility");

-- CreateIndex
CREATE UNIQUE INDEX "applications_application_number_key" ON "applications"("application_number");

-- CreateIndex
CREATE INDEX "applications_facility_idx" ON "applications"("facility");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_created_at_idx" ON "applications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "child_details_application_id_key" ON "child_details"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_details_application_id_key" ON "parent_details"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "informant_details_application_id_key" ON "informant_details"("application_id");

-- AddForeignKey
ALTER TABLE "child_details" ADD CONSTRAINT "child_details_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_details" ADD CONSTRAINT "parent_details_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "informant_details" ADD CONSTRAINT "informant_details_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
