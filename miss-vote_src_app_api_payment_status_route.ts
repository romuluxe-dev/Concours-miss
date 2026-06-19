import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/payment/status?paymentId=xxx
export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId manquant" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { candidate: true },
  });

  if (!payment) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    status: payment.status,
    candidateName: payment.candidate.name,
    numberOfVotes: payment.numberOfVotes,
    amount: payment.amount,
  });
}
