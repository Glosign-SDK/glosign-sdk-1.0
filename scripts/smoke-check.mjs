#!/usr/bin/env node

import { createGlosignClient, defaults } from "../index.js";
import { getGlosignPreflightChecklist } from "../heuristics.js";
import { buildOneSignerRemoteSigningPayload } from "../recipes.js";

function getArgFlag(name) {
  return process.argv.includes(name);
}

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

function asTrimmedString(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : fallback;
}

function summarizeTemplate(template) {
  if (!template || typeof template !== "object") {
    return null;
  }

  const fields = [
    "templateId",
    "id",
    "templateTitle",
    "templateName",
    "name",
    "title",
    "step",
    "status"
  ];

  return Object.fromEntries(fields.map((key) => [key, template[key]]).filter(([, value]) => value !== undefined));
}

function extractText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function findTextStatus(value) {
  const candidates = [];
  const stack = [value];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || typeof current !== "object") {
      continue;
    }

    for (const [key, entry] of Object.entries(current)) {
      if (entry && typeof entry === "object") {
        stack.push(entry);
        continue;
      }

      if (!entry && entry !== 0) {
        continue;
      }

      const normalizedKey = key.toLowerCase();
      if (
        normalizedKey.includes("status") ||
        normalizedKey.includes("state") ||
        normalizedKey.includes("step")
      ) {
        candidates.push(String(entry));
      }
    }
  }

  return candidates;
}

function isCompleteState(value) {
  const statuses = findTextStatus(value).map((item) => item.toLowerCase());
  return statuses.some((item) =>
    item.includes("complete") || item.includes("completed") || item.includes("signed") || item.includes("finish")
  );
}

function pickContractId(payload) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const directCandidates = [
    payload.contractId,
    payload.id,
    payload.contract_id,
    payload.data?.contractId,
    payload.data?.id,
    payload.result?.contractId,
    payload.result?.id
  ];

  for (const candidate of directCandidates) {
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

    for (const [key, entry] of Object.entries(current)) {
      if (entry && typeof entry === "object") {
        stack.push(entry);
        continue;
      }

      const normalizedKey = key.toLowerCase();
      if (
        (normalizedKey === "contractid" ||
          normalizedKey === "contract_id" ||
          normalizedKey === "id") &&
        entry !== undefined &&
        entry !== null &&
        String(entry).trim()
      ) {
        return String(entry);
      }
    }
  }

  return "";
}

async function main() {
  const live = getArgFlag("--live") || process.env.GLOSIGN_SMOKE_LIVE === "true";
  const waitComplete = getArgFlag("--wait-complete") || process.env.GLOSIGN_SMOKE_WAIT_COMPLETE === "true";
  const downloadType = asTrimmedString(
    getArgValue("--download-type", process.env.GLOSIGN_SMOKE_DOWNLOAD_TYPE || "compDocs"),
    "compDocs"
  );
  const pollIntervalMs = Number(getArgValue("--poll-interval-ms", process.env.GLOSIGN_SMOKE_POLL_INTERVAL_MS || "5000"));
  const timeoutMs = Number(getArgValue("--timeout-ms", process.env.GLOSIGN_SMOKE_POLL_TIMEOUT_MS || "300000"));

  const checklist = getGlosignPreflightChecklist({
    businessAccount: true,
    apiKey: process.env.GLOSIGN_API_KEY,
    testModeEnabled: process.env.GLOSIGN_TEST_MODE_ENABLED === "true",
    requiresTemplateId: live,
    templateId: process.env.GLOSIGN_TEMPLATE_ID
  });

  console.log("Static API surface checks:");
  console.log(`- createGlosignClient: ${typeof createGlosignClient === "function" ? "ok" : "missing"}`);
  console.log(`- getGlosignPreflightChecklist: ${typeof getGlosignPreflightChecklist === "function" ? "ok" : "missing"}`);
  console.log(`- default base URL: ${defaults.DEFAULT_BASE_URL}`);
  console.log(`- package ready: ${checklist.ready ? "yes" : "no"}`);

  if (!live) {
    console.log("Live flow skipped. Re-run with --live or GLOSIGN_SMOKE_LIVE=true.");
    return;
  }

  const apiKey = process.env.GLOSIGN_API_KEY;
  const templateId = process.env.GLOSIGN_TEMPLATE_ID;
  const signerEmail = asTrimmedString(process.env.GLOSIGN_SMOKE_SIGNER1_EMAIL, "");
  const signerName = asTrimmedString(process.env.GLOSIGN_SMOKE_SIGNER1_NAME, "Receiver");
  const contractName = asTrimmedString(process.env.GLOSIGN_SMOKE_CONTRACT_NAME, "Glosign SDK smoke test");

  if (!apiKey) {
    throw new Error("GLOSIGN_API_KEY is required for live smoke testing.");
  }

  if (!templateId) {
    throw new Error("GLOSIGN_TEMPLATE_ID is required for the live send flow.");
  }

  if (!signerEmail) {
    throw new Error("GLOSIGN_SMOKE_SIGNER1_EMAIL is required for the live send flow.");
  }

  const client = createGlosignClient({ apiKey });

  console.log("Live smoke flow:");
  const user = await client.getUser();
  console.log("- getUser: ok");
  console.log(`  ${extractText(user).slice(0, 500)}`);

  const template = await client.getTemplate(templateId);
  console.log("- getTemplate: ok");
  console.log(`  ${extractText(summarizeTemplate(template) ?? template).slice(0, 500)}`);

  const sendPayload = buildOneSignerRemoteSigningPayload({
    templateId,
    contractName,
    signerName,
    signerEmail,
    message: "Please review and sign."
  });

  const sendResponse = await client.sendTemplateContract(sendPayload);
  console.log("- sendTemplateContract: ok");
  console.log(`  ${extractText(sendResponse).slice(0, 500)}`);

  const contractId = pickContractId(sendResponse);
  if (!contractId) {
    throw new Error("Unable to locate contractId in the send response.");
  }

  console.log(`- contractId: ${contractId}`);

  if (waitComplete) {
    const deadline = Date.now() + timeoutMs;
    let lastContract = null;
    let lastSignInfo = null;

    while (Date.now() < deadline) {
      lastContract = await client.getContract(contractId);
      console.log("- getContract: polled");
      if (isCompleteState(lastContract)) {
        break;
      }

      try {
        lastSignInfo = await client.getContractSignInfo(contractId);
        console.log("- getContractSignInfo: polled");
        if (isCompleteState(lastSignInfo)) {
          break;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/not complete|complete/i.test(message)) {
          throw error;
        }
        console.log("- getContractSignInfo: waiting for signer");
      }

      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    const completed = isCompleteState(lastContract) || isCompleteState(lastSignInfo);
    console.log(`- waitComplete: ${completed ? "done" : "timed out"}`);

    const downloaded = await client.downloadContractCopy({ contractId, type: downloadType });
    if (Buffer.isBuffer(downloaded)) {
      console.log(`- downloadContractCopy: ok (${downloaded.length} bytes, type=${downloadType})`);
    } else {
      console.log(`- downloadContractCopy: ok (${extractText(downloaded).slice(0, 500)})`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exitCode = 1;
});
