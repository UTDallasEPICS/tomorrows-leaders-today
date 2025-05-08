const { PrismaClient } = require('@prisma/client');
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
    // Create Grant
    const createdGrant = await prisma.grants.create({
      data: {
        external_id: grant.external_id,
        title: grant.title,
        status: grant.status,
        website: grant.url,
      },
    });
    // Create Timelines
    await prisma.grantTimelines.createMany({
      data: [
        {
          grant_id: createdGrant.grant_id,
          event_type: 'posted',
          event_date: new Date(grant.posted),
        },

        {
          grant_id: createdGrant.grant_id,
          event_type: 'closes',
          event_date: new Date(grant.closes),
        },
      ],
    });
    // Create Funding Opportunity
    const funding = await prisma.fundingOpportunities.create({
      data: {
        name: grant.title,
        source: grant.agency,
        website: grant.url,
        application_deadline: new Date(grant.closes),
      },
    });

    // Link Grant to Funding
    await prisma.grantFunding.create({
      data: {
        grant_id: createdGrant.grant_id,
        funding_id: funding.funding_id,
      },


    });

    console.log(`✅ Seeded: ${grant.title}`);
  }

  await prisma.$disconnect();
}


seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
});