import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCinetPayTransaction } from "@/lib/cinetpay";

// POST /api/payment/webhook
// CinetPay appelle cette URL automatiquement après chaque tentative de paiement.
// On ne fait JAMAIS confiance aux données envoyées directement par le webhook :
// on revérifie systématiquement le statut auprès de CinetPay avant de valider les votes.
// Cela évite qu'une personne malveillante simule un paiement réussi en appelant
// cette URL elle-même.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData().catch(() => null);
    const body = formData ? Object.fromEntries(formData) : await req.json();

    const transactionId = body.cpm_trans_id || body.transaction_id;
    if (!transactionId) {
      return NextResponse.json({ error: "transaction_id manquant" }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({
      where: { transactionId: String(transactionId) },
    });

    if (!payment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    // Évite de traiter deux fois le même paiement (webhook parfois envoyé en double)
    if (payment.status === "success") {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    // Vérification réelle auprès de CinetPay
    const verification = await verifyCinetPayTransaction(String(transactionId));
    const isSuccess = verification?.data?.status === "ACCEPTED";

    if (isSuccess) {
      // Création des N votes liés à ce paiement, en une transaction atomique
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: "success", providerRef: verification?.data?.operator_id || null },
        });

        const votesData = Array.from({ length: payment.numberOfVotes }).map(() => ({
          candidateId: payment.candidateId,
          paymentId: payment.id,
        }));

        await tx.vote.createMany({ data: votesData });
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "failed" },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Erreur webhook paiement:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
