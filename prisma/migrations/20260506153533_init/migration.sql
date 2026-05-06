-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'guest');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('pending', 'verified');

-- CreateEnum
CREATE TYPE "NoteFormat" AS ENUM ('material', 'hours');

-- CreateTable
CREATE TABLE "pg_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "lastName" TEXT,
    "nif" TEXT,
    "role" "Role" NOT NULL DEFAULT 'admin',
    "status" "UserStatus" NOT NULL DEFAULT 'pending',
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pg_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pg_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cif" TEXT NOT NULL,
    "isFreelance" BOOLEAN NOT NULL DEFAULT false,
    "logo" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pg_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pg_clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cif" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "street" TEXT,
    "number" TEXT,
    "postal" TEXT,
    "city" TEXT,
    "province" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pg_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pg_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "projectCode" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "street" TEXT,
    "number" TEXT,
    "postal" TEXT,
    "city" TEXT,
    "province" TEXT,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pg_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pg_workers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "deliveryNoteId" TEXT NOT NULL,

    CONSTRAINT "pg_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pg_delivery_notes" (
    "id" TEXT NOT NULL,
    "format" "NoteFormat" NOT NULL,
    "description" TEXT,
    "workDate" TIMESTAMP(3) NOT NULL,
    "material" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "hours" DOUBLE PRECISION,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signatureUrl" TEXT,
    "pdfUrl" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pg_delivery_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pg_users_email_key" ON "pg_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pg_companies_cif_key" ON "pg_companies"("cif");

-- CreateIndex
CREATE UNIQUE INDEX "pg_companies_ownerId_key" ON "pg_companies"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "pg_clients_companyId_cif_key" ON "pg_clients"("companyId", "cif");

-- CreateIndex
CREATE UNIQUE INDEX "pg_projects_companyId_projectCode_key" ON "pg_projects"("companyId", "projectCode");

-- AddForeignKey
ALTER TABLE "pg_users" ADD CONSTRAINT "pg_users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "pg_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pg_companies" ADD CONSTRAINT "pg_companies_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "pg_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pg_clients" ADD CONSTRAINT "pg_clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pg_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pg_clients" ADD CONSTRAINT "pg_clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "pg_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pg_projects" ADD CONSTRAINT "pg_projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pg_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pg_projects" ADD CONSTRAINT "pg_projects_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "pg_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pg_projects" ADD CONSTRAINT "pg_projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "pg_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pg_workers" ADD CONSTRAINT "pg_workers_deliveryNoteId_fkey" FOREIGN KEY ("deliveryNoteId") REFERENCES "pg_delivery_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pg_delivery_notes" ADD CONSTRAINT "pg_delivery_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "pg_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pg_delivery_notes" ADD CONSTRAINT "pg_delivery_notes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "pg_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pg_delivery_notes" ADD CONSTRAINT "pg_delivery_notes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "pg_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pg_delivery_notes" ADD CONSTRAINT "pg_delivery_notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pg_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
