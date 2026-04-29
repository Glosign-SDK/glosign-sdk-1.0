#!/usr/bin/env node

import { createGlosignClient } from "../client.js";
import { buildOneSignerRemoteSigningPayload } from "../recipes.js";

function getArgValue(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return fallback;
  }

  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    return fallback;
  }

  return value;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function requireText(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing ${label}`);
  }

  return value.trim();
}

function pickContractId(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const candidates = [
    payload.contractId,
    payload.id,
    payload.contract_id,
    payload.data?.contractId,
    payload.data?.id,
    payload.result?.contractId,
    payload.result?.id
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) {
      return String(candidate);
    }
  }

  const stack = [payload];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") {
      continue;
    }

    for (const [key, value] of Object.entries(current)) {
      if (value && typeof value === "object") {
        stack.push(value);
        continue;
      }

      const normalizedKey = key.toLowerCase();
      if (
        (normalizedKey === "contractid" || normalizedKey === "contract_id" || normalizedKey === "id") &&
        value !== undefined &&
        value !== null &&
        String(value).trim()
      ) {
        return String(value);
      }
    }
  }

  return "";
}

async function main() {
  const apiKey = requireText(process.env.GLOSIGN_API_KEY, "GLOSIGN_API_KEY");
  const templateId = requireText(
    getArgValue("--template-id", process.env.GLOSIGN_TEMPLATE_ID || ""),
    "--template-id or GLOSIGN_TEMPLATE_ID"
  );
  const signerEmail = requireText(
    getArgValue("--signer-email", process.env.GLOSIGN_SMOKE_SIGNER1_EMAIL || ""),
    "--signer-email"
  );

  const signerName = getArgValue("--signer-name", process.env.GLOSIGN_SMOKE_SIGNER1_NAME || "Receiver");
  const contractName = getArgValue(
    "--contract-name",
    process.env.GLOSIGN_SMOKE_CONTRACT_NAME || "Glosign one-signer remote signing"
  );
  const message = getArgValue("--message", "Please review and sign.");
  const json = hasFlag("--json");

  const client = createGlosignClient({ apiKey });
  const payload = buildOneSignerRemoteSigningPayload({
    templateId,
    contractName,
    signerName,
    signerEmail,
    message
  });

  const response = await client.sendTemplateContract(payload);
  const contractId = pickContractId(response);

  if (json) {
    console.log(
      JSON.stringify(
        {
          contractId,
          response
        },
        null,
        2
      )
    );
    return;
  }

  console.log("Glosign one-signer remote signing request sent.");
  console.log(`contractId: ${contractId || "(not found in response)"}`);
  console.log(`contractName: ${contractName}`);
  console.log(`signer: ${signerName} <${signerEmail}>`);
  console.log("");
  console.log("Next:");
  console.log(`- Check status: npx glosign-status --id ${contractId || "<CONTRACT_ID>"}`);
  console.log(`- Download after completion: npx glosign-download --id ${contractId || "<CONTRACT_ID>"}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
