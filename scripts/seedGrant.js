import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const grants = [
  {
    external_id: 'FR-6901-N-73',
    title: 'Tribal Housing and Urban Development-Veterans Affairs Supportive Housing (Tribal HUD-VASH) Expansion (Revised)',
    agency: 'Department of Housing and Urban Development',
    status: 'posted',
    posted: '2025-04-24',
    closes: '2025-08-15',
    url: null,
  },
  {
    external_id: '22-632',
    title: 'Cyberinfrastructure for Sustained Scientific Innovation',
    agency: 'National Science Foundation',
    status: 'posted',
    posted: '2025-04-24',
    closes: '2025-12-01',
    url: null,
  },
  {
    external_id: 'FOA-ETA-25-32',
    title: 'Workforce Data Quality Initiative - WDQI Round 10',
    agency: 'Employment and Training Administration',
    status: 'posted',
    posted: '2025-04-24',
    closes: '2025-05-27',
    url: null,
  },
  {
    external_id: '20250701-UG',
    title: 'National Garden of American Heroes: Statues',
    agency: 'National Endowment for the Humanities',
    status: 'posted',
    posted: '2025-04-24',
    closes: '2025-07-01',
    url: null,
  },
  {
    external_id: 'ED-GRANTS-042325-001',
    title: 'Office of Elementary and Secondary Education (OESE): District of Columbia Opportunity Scholarship Program CFDA Number 84.370A',
    agency: 'Department of Education',
    status: 'posted',
    posted: '2025-04-23',
    closes: '2025-07-07',
    url: null,
  }
];

async function seed() {
  // Ensure a SYSTEM user exists for logs
  let systemUser = await prisma.user.findUnique({
    where: { id: "SYSTEM" }
  });

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        id: "SYSTEM",
        name: "System",
        email: "system@tlt.internal",
        emailVerified: true
      }
    });
  }

  for (const grant of grants) {
    const existing = await prisma.grant.findUnique({
      where: { opportunityNumber: grant.external_id }
    });

    if (existing) {
      console.log(`⚠️ Skipped existing grant: ${grant.title}`);
      continue;
    }

    // Create Grant
    const createdGrant = await prisma.grant.create({
      data: {
        opportunityNumber: grant.external_id,
        title: grant.title,
        agency: grant.agency,
        openingDate: new Date(grant.posted),
        closingDate: new Date(grant.closes),
        applicationLink: grant.url,
      }
    });

    console.log(`✅ Seeded: ${createdGrant.title}`);

    // Create Log entries for this grant
    await prisma.log.create({
      data: {
        grantId: createdGrant.id,
        userId: "SYSTEM",
        originalStatus: null,
        newStatus: "posted"
      }
    });

    await prisma.log.create({
      data: {
        grantId: createdGrant.id,
        userId: "SYSTEM",
        originalStatus: "posted",
        newStatus: "imported"
      }
    });

    console.log(`📝 Logs created for: ${createdGrant.title}`);
  }

  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
