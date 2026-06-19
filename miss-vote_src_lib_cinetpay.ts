// Intégration CinetPay
// Documentation officielle : https://docs.cinetpay.com
//
// Variables d'environnement nécessaires (à mettre dans .env et sur Railway/Render) :
//   CINETPAY_API_KEY      -> ta clé API (tableau de bord CinetPay > Intégration)
//   CINETPAY_SITE_ID      -> ton ID de site (tableau de bord CinetPay > Intégration)
//   NEXT_PUBLIC_BASE_URL  -> l'URL publique de ton site, ex: https://missvote.com
//
// IMPORTANT : tant que ces variables ne sont pas remplies, le paiement réel
// ne fonctionnera pas. Le site affichera une erreur claire à l'utilisateur
// plutôt que de planter silencieusement.

const CINETPAY_API_URL = "https://api-checkout.cinetpay.com/v2/payment";

interface InitPaymentParams {
  transactionId: string;
  amount: number;
  description: string;
  customerName?: string;
  customerPhone: string;
}

export async function initCinetPayPayment(params: InitPaymentParams) {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!apiKey || !siteId || !baseUrl) {
    throw new Error(
      "CONFIG_MANQUANTE: Les clés CinetPay (CINETPAY_API_KEY, CINETPAY_SITE_ID) ou NEXT_PUBLIC_BASE_URL ne sont pas configurées. Va dans les paramètres admin pour les renseigner."
    );
  }

  const body = {
    apikey: apiKey,
    site_id: siteId,
    transaction_id: params.transactionId,
    amount: params.amount,
    currency: "XOF",
    description: params.description,
    customer_name: params.customerName || "Votant",
    customer_surname: "",
    customer_phone_number: params.customerPhone,
    notify_url: `${baseUrl}/api/payment/webhook`,
    return_url: `${baseUrl}/vote/merci`,
    channels: "ALL", // accepte mobile money ET carte
    lang: "FR",
  };

  const response = await fetch(CINETPAY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (data.code !== "201") {
    throw new Error(`Erreur CinetPay: ${data.message || "Échec de l'initialisation du paiement"}`);
  }

  return {
    paymentUrl: data.data.payment_url,
    paymentToken: data.data.payment_token,
  };
}

// Vérifie le statut réel d'une transaction auprès de CinetPay
// (à utiliser dans le webhook, ne JAMAIS faire confiance aveuglément
// aux données envoyées par le webhook sans vérifier)
export async function verifyCinetPayTransaction(transactionId: string) {
  const apiKey = process.env.CINETPAY_API_KEY;
  const siteId = process.env.CINETPAY_SITE_ID;

  const response = await fetch("https://api-checkout.cinetpay.com/v2/payment/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: apiKey,
      site_id: siteId,
      transaction_id: transactionId,
    }),
  });

  const data = await response.json();
  return data; // data.data.status sera "ACCEPTED" si le paiement est confirmé
}
