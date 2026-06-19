import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initCinetPayPayment } from "@/lib/cinetpay";

const PRIX_PAR_VOTE = 200; // en FCFA

// POST /api/payment/init
// Body attendu : { candidateId, numberOfVotes, voterPhone, voterName? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId, numberOfVotes, voterPhone, voterName } = body;

    // --- Validations de base ---
    if (!candidateId || !voterPhone) {
      return NextResponse.json(
        { error: "Candidate et numéro de téléphone sont obligatoires." },
        { status: 400 }
      );
    }

    const votes = parseInt(numberOfVotes, 10);
    if (!votes || votes < 1 || votes > 1000) {
      return NextResponse.json(
        { error: "Le nombre de votes doit être compris entre 1 et 1000." },
        { status: 400 }
      );
    }

    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate introuvable." }, { status: 404 });
    }

    const amount = votes * PRIX_PAR_VOTE;
    const transactionId = `MV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // On crée le paiement en statut "pending" AVANT de contacter CinetPay
    const payment = await prisma.payment.create({
      data: {
        candidateId,
        voterPhone,
        voterName: voterName || null,
        numberOfVotes: votes,
        amount,
        status: "pending",
        transactionId,
      },
    });

    const { paymentUrl } = await initCinetPayPayment({
      transactionId,
      amount,
      description: `${votes} vote(s) pour ${candidate.name}`,
      customerName: voterName,
      customerPhone: voterPhone,
    });

    return NextResponse.json({ paymentUrl, paymentId: payment.id });
  } catch (err: any) {
    const message = err?.message || "Erreur inconnue";
    // Message clair si les clés CinetPay ne sont pas encore configurées
    if (message.startsWith("CONFIG_MANQUANTE")) {
      return NextResponse.json(
        { error: "Le paiement n'est pas encore configuré. Contacte l'administrateur du site." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
