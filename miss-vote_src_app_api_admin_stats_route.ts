import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const candidates = await prisma.candidate.findMany({
    orderBy: { number: "asc" },
    include: { _count: { select: { votes: true } } },
  });

  const successPayments = await prisma.payment.aggregate({
    where: { status: "success" },
    _sum: { amount: true, numberOfVotes: true },
  });

  const pendingCount = await prisma.payment.count({ where: { status: "pending" } });
  const failedCount = await prisma.payment.count({ where: { status: "failed" } });

  const results = candidates
    .map((c) => ({
      id: c.id,
      number: c.number,
      name: c.name,
      voteCount: c._count.votes,
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

  return NextResponse.json({
    results,
    totalVotes: successPayments._sum.numberOfVotes || 0,
    totalAmount: successPayments._sum.amount || 0,
    pendingPayments: pendingCount,
    failedPayments: failedCount,
  });
}
