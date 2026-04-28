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

function pad(value, width) {
  const text = String(value ?? "");
  return text.length >= width ? text : `${text}${" ".repeat(width - text.length)}`;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function defaultFromDate() {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return formatDate(date);
}

function defaultToDate() {
  return formatDate(new Date());
}

function normalizeContracts(response) {
  if (Array.isArray(response?.contractList)) {
    return response.contractList;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
}

function normalizeContractDetail(response) {
  if (response?.contract && typeof response.contract === "object") {
    return response.contract;
  }

  if (response && typeof response === "object") {
    return response;
  }

  return {};
}

function matchesQuery(contract, query) {
  if (!query) {
    return true;
  }

  const receiverText = Array.isArray(contract?.receiverList)
    ? contract.receiverList.map((receiver) => [receiver.name, receiver.email].filter(Boolean).join(" ")).join(" ")
    : "";

  const haystack = [
    contract.contractId,
    contract.id,
    contract.title,
    contract.contract_status,
    contract.contract_type,
    receiverText
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
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

function printContractSummary(contract, signInfo) {
  console.log(`contractId: ${contract.contractId || contract.id || ""}`);
  console.log(`title: ${contract.title || ""}`);
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

  if (signInfo) {
    console.log("");
    console.log("sign_info:");
    console.log(JSON.stringify(signInfo, null, 2));
  }
}

async function main() {
  const apiKey = process.env.GLOSIGN_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GLOSIGN_API_KEY");
  }

  const contractId = getArgValue("--id", "");
  const from = getArgValue("--from", defaultFromDate());
  const to = getArgValue("--to", defaultToDate());
  const query = getArgValue("--query", "");
  const json = hasFlag("--json");
  const includeSignInfo = hasFlag("--sign-info");

  const client = createGlosignClient({ apiKey });

  if (contractId) {
    const contractResponse = await client.getContract(contractId);
    const contract = normalizeContractDetail(contractResponse);
    const signInfo = includeSignInfo ? await readSignInfo(client, contractId) : null;

    if (json) {
      console.log(JSON.stringify({ contract: contractResponse, signInfo }, null, 2));
      return;
    }

    printContractSummary(contract, signInfo);
    return;
  }

  const response = await client.listContracts({
    from,
    to,
    start_date: from,
    end_date: to
  });

  const contracts = normalizeContracts(response).filter((contract) => matchesQuery(contract, query));

  if (json) {
    console.log(
      JSON.stringify(
        {
          from,
          to,
          total: contracts.length,
          contracts
        },
        null,
        2
      )
    );
    return;
  }

  if (contracts.length === 0) {
    console.log(`No contracts found for range ${from}-${to}${query ? ` and query "${query}"` : ""}.`);
    return;
  }

  console.log(`Contracts ${from}-${to}${query ? ` query="${query}"` : ""}`);
  console.log(
    `${pad("CONTRACT_ID", 34)} ${pad("TITLE", 28)} ${pad("STATUS", 10)} ${pad("TYPE", 6)} UPDATED_AT`
  );

  for (const contract of contracts) {
    console.log(
      `${pad(contract.contractId || contract.id, 34)} ${pad(contract.title, 28)} ${pad(contract.contract_status || contract.status, 10)} ${pad(contract.contract_type || contract.type, 6)} ${contract.updated_at || ""}`
    );
  }

  console.log("");
  console.log("Use --id <CONTRACT_ID> to inspect one contract.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
