/*
  Warnings:

  - You are about to drop the `ApplicationRequirement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FundingOpportunity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GrantCategory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GrantFunding` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GrantStipulation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GrantTimeline` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `awardDetails` on the `Grant` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Grant` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Grant` table. All the data in the column will be lost.
  - You are about to drop the column `externalId` on the `Grant` table. All the data in the column will be lost.
  - You are about to drop the column `interviewRequired` on the `Grant` table. All the data in the column will be lost.
  - You are about to drop the column `rollingBasis` on the `Grant` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Grant` table. All the data in the column will be lost.
  - You are about to drop the column `website` on the `Grant` table. All the data in the column will be lost.
  - Added the required column `opportunityNumber` to the `Grant` table without a default value. This is not possible if the table is not empty.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ApplicationRequirement";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Contact";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "FundingOpportunity";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GrantCategory";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GrantFunding";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GrantStipulation";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "GrantTimeline";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Account" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GrantContact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grantId" INTEGER NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    CONSTRAINT "GrantContact_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AssistanceListing" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grantId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "link" TEXT,
    CONSTRAINT "AssistanceListing_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrantApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grantId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "applicationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'Not Applied',
    CONSTRAINT "GrantApplication_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GrantApplication_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Grant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "opportunityNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "agency" TEXT,
    "openingDate" DATETIME,
    "closingDate" DATETIME,
    "applicationType" TEXT,
    "category" TEXT,
    "applicationLink" TEXT,
    "awardFloor" REAL,
    "awardCeiling" REAL,
    "totalFundingAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Grant" ("createdAt", "id", "title", "updatedAt") SELECT "createdAt", "id", "title", "updatedAt" FROM "Grant";
DROP TABLE "Grant";
ALTER TABLE "new_Grant" RENAME TO "Grant";
CREATE UNIQUE INDEX "Grant_opportunityNumber_key" ON "Grant"("opportunityNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");
