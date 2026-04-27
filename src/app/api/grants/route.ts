import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient(); 

export async function GET() {
  try {
    const grants = await prisma.grant.findMany({
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const grant = await prisma.grant.upsert({
      where:  { opportunityNumber: body.opportunityNumber },
      update: {
        title:           body.title,
        agency:          body.agency,
        closingDate:     body.closingDate ? new Date(body.closingDate) : null,
        applicationType: body.applicationType,
        category:        body.category,
        applicationLink: body.applicationLink,
      },
      create: {
        opportunityNumber:  body.opportunityNumber,
        title:              body.title,
        agency:             body.agency,
        openingDate:        body.openingDate ? new Date(body.openingDate) : null,
        closingDate:        body.closingDate ? new Date(body.closingDate) : null,
        applicationType:    body.applicationType,
        category:           body.category,
        applicationLink:    body.applicationLink,
        awardFloor:         body.awardFloor ?? null,
        awardCeiling:       body.awardCeiling ?? null,
        totalFundingAmount: body.totalFundingAmount ?? null,
      },
    });
    return NextResponse.json(grant, { status: 201 });
  } catch (error) {
    console.error("Error saving grant:", error);
    return NextResponse.json(
      { error: "Failed to save grant." },
      { status: 500 }
    );
  }
}
