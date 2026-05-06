import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Keywords matching TLT's target audience groups
const TARGET_KEYWORDS = [
  'family engagement',
  'teen',
  'higher education',
  'college',
  'workforce',
  'career',
  'women',
  'girls',
  'technology',
  'digital',
  'leadership',
  'mentoring',
  'professional development',
  'adult education',
  'training',
  'literacy',
  'education',
];

export async function GET() {
  try {
    const grants = await prisma.grant.findMany({
      where: {
        OR: TARGET_KEYWORDS.map(keyword => ({
          title: {
            contains: keyword,
          },
        })),
      },
      include: {
        logs: {
          include: { user: true },
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(grants);
  } catch (error) {
    console.error("Error fetching grants:", error);
    return NextResponse.json(
      { error: "Failed to fetch grants." },
      { status: 500 }
    );
  }
}