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
