import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/candidates -> liste des 15 candidates avec leur total de votes
export async function GET() {
  const candidates = await prisma.candidate.findMany({
    orderBy: { number: "asc" },
    include: {
      _count: { select: { votes: true } },
    },
  });

  const result = candidates.map((c) => ({
    id: c.id,
    number: c.number,
    name: c.name,
    bio: c.bio,
    imageUrl: c.imageUrl,
    voteCount: c._count.votes,
  }));

  return NextResponse.json(result);
}
