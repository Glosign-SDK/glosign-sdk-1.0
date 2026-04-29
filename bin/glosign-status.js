#!/usr/bin/env node

import { createGlosignClient } from "../client.js";

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

function normalizeContract(response) {
  if (response?.contract && typeof response.contract === "object") {
    return response.contract;
  }

  if (response && typeof response === "object") {
    return response;
  }

  return {};
}

async function readSignInfo(client, contractId) {
  try {
    return await client.getContractSignInfo(contractId);
  } catch (error) {
    const message = error?.body || error?.message || String(error);
    if (/not complete|contract not complete/i.test(String(message))) {
      return { status: "waiting_for_signer", detail: "contract not complete" };
    }

    throw error;
  }
}

function printStatus(contract, signInfo) {
  const contractId = contract.contractId || contract.id || "";
  console.log(`contractId: ${contractId}`);
  console.log(`title: ${contract.title || contract.contractName || ""}`);
  console.log(`status: ${contract.contract_status || contract.status || ""}`);
  console.log(`type: ${contract.contract_type || contract.type || ""}`);
  console.log(`created_at: ${contract.created_at || ""}`);
  console.log(`updated_at: ${contract.updated_at || ""}`);
  console.log(`completed_at: ${contract.completed_at || ""}`);

  const receivers = Array.isArray(contract.receiverList)
    ? contract.receiverList
    : Array.isArray(contract.receiver)
      ? contract.receiver
      : [];

  if (receivers.length > 0) {
    console.log("receivers:");
    for (const receiver of receivers) {
      console.log(
        `- ${receiver.name || receiver.user_name || ""} <${receiver.email || receiver.user_email || ""}> status=${receiver.contract_status || receiver.status || ""}`
      );
    }
  }

  console.log("");
  console.log("sign_info:");
  console.log(JSON.stringify(signInfo, null, 2));

  if (signInfo?.status === "waiting_for_signer") {
    console.log("");
    console.log("Waiting for signer completion in Glosign.");
  }
}

async function main() {
  const apiKey = requireText(process.env.GLOSIGN_API_KEY, "GLOSIGN_API_KEY");
  const contractId = requireText(getArgValue("--id", ""), "--id <CONTRACT_ID>");
  const json = hasFlag("--json");

  const client = createGlosignClient({ apiKey });
  const contractResponse = await client.getContract(contractId);
  const contract = normalizeContract(contractResponse);
  const signInfo = await readSignInfo(client, contractId);

  if (json) {
    console.log(JSON.stringify({ contract: contractResponse, signInfo }, null, 2));
    return;
  }

  printStatus(contract, signInfo);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
