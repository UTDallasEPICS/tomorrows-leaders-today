-- CreateTable
CREATE TABLE "GrantCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "definitionLink" TEXT
);

-- CreateTable
CREATE TABLE "Grant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "externalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT,
    "website" TEXT,
    "awardDetails" TEXT,
    "interviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "rollingBasis" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "categoryId" INTEGER,
    CONSTRAINT "Grant_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GrantCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrantTimeline" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grantId" INTEGER NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "details" TEXT,
    CONSTRAINT "GrantTimeline_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationRequirement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grantId" INTEGER NOT NULL,
    "eligibility" TEXT,
    "materials" TEXT,
    "instructions" TEXT,
    "notes" TEXT,
    CONSTRAINT "ApplicationRequirement_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grantId" INTEGER NOT NULL,
    "contactType" TEXT,
    "contactInfo" TEXT,
    "availability" TEXT,
    CONSTRAINT "Contact_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrantStipulation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "grantId" INTEGER NOT NULL,
    "condition" TEXT,
    "notes" TEXT,
    CONSTRAINT "GrantStipulation_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FundingOpportunity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "totalFundingAmount" REAL,
    "maxAwardAmount" REAL,
    "applicationDeadline" DATETIME,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GrantFunding" (
    "grantId" INTEGER NOT NULL,
    "fundingId" INTEGER NOT NULL,

    PRIMARY KEY ("grantId", "fundingId"),
    CONSTRAINT "GrantFunding_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "Grant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GrantFunding_fundingId_fkey" FOREIGN KEY ("fundingId") REFERENCES "FundingOpportunity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Grant_externalId_key" ON "Grant"("externalId");
