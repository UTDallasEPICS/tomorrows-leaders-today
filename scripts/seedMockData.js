import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Education', description: 'Grants related to education programs and research', definitionLink: null },
  { name: 'Environment', description: 'Environmental conservation and sustainability', definitionLink: null },
];

const grants = [
  {
    externalId: 'MOCK-EDU-001',
    title: 'Education Innovation Grant',
    description: 'Support for projects that innovate in K-12 education.',
    status: 'open',
    website: 'https://example.org/edu-innovation',
    awardDetails: 'Up to $50,000',
    interviewRequired: false,
    rollingBasis: false,
    categoryName: 'Education',
    timelines: [
      { eventType: 'posted', eventDate: '2025-01-15' },
      { eventType: 'closes', eventDate: '2025-12-31' },
    ],
    requirements: {
      eligibility: 'Non-profits and universities',
      materials: 'Proposal, budget, CVs',
      instructions: 'Submit via portal',
      notes: 'Two-page summary required'
    },
    contacts: [
      { contactType: 'General', contactInfo: 'grants@example.org', availability: 'Mon-Fri' }
    ],
    stipulations: [
      { condition: 'Match required', notes: 'At least 10% match from other sources' }
    ],
    funding: { name: 'Education Fund', source: 'Example Foundation', totalFundingAmount: 1000000, maxAwardAmount: 50000, applicationDeadline: '2025-12-31' }
  },
  {
    externalId: 'MOCK-ENV-001',
    title: 'Community Conservation Grant',
    description: 'Small grants for community-led conservation efforts.',
    status: 'open',
    website: 'https://example.org/conservation',
    awardDetails: 'Up to $10,000',
    interviewRequired: false,
    rollingBasis: true,
    categoryName: 'Environment',
    timelines: [
      { eventType: 'posted', eventDate: '2025-03-01' }
    ],
    requirements: {
      eligibility: 'Community organizations',
      materials: 'Short proposal, photos',
      instructions: 'Email submission',
      notes: ''
    },
    contacts: [
      { contactType: 'Program Officer', contactInfo: 'conserve@example.org', availability: 'Email only' }
    ],
    stipulations: [],
    funding: { name: 'Conservation Fund', source: 'Green Trust', totalFundingAmount: 250000, maxAwardAmount: 10000 }
  }
];

async function seed() {
  // Upsert categories
  const categoryMap = {};
  for (const c of categories) {
    // grantCategory.name is not unique in schema, so use findFirst -> update/create
    let cat = await prisma.grantCategory.findFirst({ where: { name: c.name } });
    if (cat) {
      cat = await prisma.grantCategory.update({ where: { id: cat.id }, data: { description: c.description, definitionLink: c.definitionLink } });
      console.log(`✅ Category updated: ${cat.name}`);
    } else {
      cat = await prisma.grantCategory.create({ data: c });
      console.log(`✅ Category created: ${cat.name}`);
    }
    categoryMap[c.name] = cat;
  }

  for (const g of grants) {
    const existing = await prisma.grant.findUnique({ where: { externalId: g.externalId } });
    if (existing) {
      console.log(`⚠️ Skipped existing grant: ${g.title}`);
      continue;
    }

    const created = await prisma.grant.create({
      data: {
        externalId: g.externalId,
        title: g.title,
        description: g.description,
        status: g.status,
        website: g.website,
        awardDetails: g.awardDetails,
        interviewRequired: g.interviewRequired ?? false,
        rollingBasis: g.rollingBasis ?? false,
        categoryId: categoryMap[g.categoryName]?.id
      }
    });

    if (g.timelines && g.timelines.length) {
      await prisma.grantTimeline.createMany({
        data: g.timelines.map((t) => ({
          grantId: created.id,
          eventType: t.eventType,
          eventDate: new Date(t.eventDate),
          details: t.details ?? null
        }))
      });
    }

    if (g.requirements) {
      await prisma.applicationRequirement.create({
        data: {
          grantId: created.id,
          eligibility: g.requirements.eligibility,
          materials: g.requirements.materials,
          instructions: g.requirements.instructions,
          notes: g.requirements.notes
        }
      });
    }

    if (g.contacts && g.contacts.length) {
      for (const c of g.contacts) {
        await prisma.contact.create({ data: { grantId: created.id, contactType: c.contactType, contactInfo: c.contactInfo, availability: c.availability } });
      }
    }

    if (g.stipulations && g.stipulations.length) {
      for (const s of g.stipulations) {
        await prisma.grantStipulation.create({ data: { grantId: created.id, condition: s.condition, notes: s.notes } });
      }
    }

    if (g.funding) {
      const fundData = {
        name: g.funding.name,
        description: g.funding.description ?? null,
        source: g.funding.source ?? null,
        totalFundingAmount: g.funding.totalFundingAmount ?? null,
        maxAwardAmount: g.funding.maxAwardAmount ?? null,
        applicationDeadline: g.funding.applicationDeadline ? new Date(g.funding.applicationDeadline) : null,
      };

        // fundingOpportunity.name is not unique, use findFirst then update/create
        let funding = await prisma.fundingOpportunity.findFirst({ where: { name: fundData.name } });
        if (funding) {
          funding = await prisma.fundingOpportunity.update({ where: { id: funding.id }, data: fundData });
        } else {
          funding = await prisma.fundingOpportunity.create({ data: fundData });
        }

        await prisma.grantFunding.create({ data: { grantId: created.id, fundingId: funding.id } });
    }

    console.log(`✅ Seeded grant: ${g.title}`);
  }

  // Create a test user to associate with ChangeLog entries
  const testUser = await prisma.user.upsert({
    where: { email: 'tester@example.org' },
    update: { name: 'Seed Tester' },
    create: { email: 'tester@example.org', name: 'Seed Tester' }
  });

  // Create ChangeLog entries for each grant to provide application history
  for (const g of grants) {
    const grant = await prisma.grant.findUnique({ where: { externalId: g.externalId } });
    if (!grant) continue;

    // Create two example change logs: one prior status and current
    await prisma.changeLog.create({
      data: {
        grantId: grant.id,
        userId: testUser.id,
        originalStatus: 'draft',
        newStatus: grant.status ?? 'open',
      }
    });

    // Add a second historical change if desired
    await prisma.changeLog.create({
      data: {
        grantId: grant.id,
        userId: testUser.id,
        originalStatus: 'submitted',
        newStatus: 'draft',
        updatedAt: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7) // a week ago
      }
    });
  }

  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
