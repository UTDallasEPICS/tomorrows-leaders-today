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
  for (const grant of grants) {
    const existing = await prisma.grant.findUnique({
      where: { externalId: grant.external_id }
    });

    if (existing) {
      console.log(`⚠️ Skipped existing grant: ${grant.title}`);
      continue;
    }

    const created = await prisma.grant.create({
      data: {
        externalId: grant.external_id,
        title: grant.title,
        status: grant.status,
        website: grant.url,
      }
    });

    await prisma.grantTimeline.createMany({
      data: [
        {
          grantId: created.id,
          eventType: 'posted',
          eventDate: new Date(grant.posted)
        },
        {
          grantId: created.id,
          eventType: 'closes',
          eventDate: new Date(grant.closes)
        }
      ]
    });

    const funding = await prisma.fundingOpportunity.create({
      data: {
        name: grant.title,
        source: grant.agency,
        website: grant.url,
        applicationDeadline: new Date(grant.closes)
      }
    });

    await prisma.grantFunding.create({
      data: {
        grantId: created.id,
        fundingId: funding.id
      }
    });

    console.log(`✅ Seeded: ${grant.title}`);
  }

  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
