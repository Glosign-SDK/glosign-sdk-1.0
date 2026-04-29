export const DEFAULT_REMOTE_SIGNING_FLOW = [
  "Install @glosign/sdk and confirm Node.js 18+ ESM runtime.",
  "Ask for GLOSIGN_API_KEY and a prepared GLOSIGN_TEMPLATE_ID.",
  "List or inspect templates before sending.",
  "Send one general remote-signing contract to one email receiver.",
  "Show the created contractId and current send status.",
  "Poll the contract until the signer completes through Glosign.",
  "Download the completed signed PDF with downloadContractCopy."
];

function requireText(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing ${name}`);
  }

  return value.trim();
}

export function buildOneSignerRemoteSigningPayload(input = {}) {
  const templateId = requireText(input.templateId, "templateId");
  const signerEmail = requireText(input.signerEmail, "signerEmail");
  const contractName = requireText(input.contractName || "Glosign remote signing test", "contractName");
  const signerName = requireText(input.signerName || "Receiver", "signerName");
  const message = input.message || "Please review and sign.";

  return {
    templateId,
    contractName,
    commonMessage: message,
    emailFlag: true,
    mobileFlag: false,
    contractList: [
      {
        signOrder: false,
        isReview: false,
        contractName,
        receiverList: [
          {
            signOrderNumber: 1,
            name: signerName,
            email: signerEmail,
            lang: input.lang || "kr",
            expired_day: input.expiredDay || 1,
            message,
            coord: input.coord || []
          }
        ]
      }
    ]
  };
}
