#!/usr/bin/env node

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
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

function extensionFor(type) {
  if (type === "attachment") {
    return "zip";
  }

  return "pdf";
}

async function main() {
  const apiKey = process.env.GLOSIGN_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GLOSIGN_API_KEY");
  }

  const contractId = getArgValue("--id", "");
  if (!contractId) {
    throw new Error("Missing --id <CONTRACT_ID>");
  }

  const type = getArgValue("--type", "compDocs");
  const output =
    getArgValue("--output", "") ||
    `./glosign-${contractId}-${type}.${extensionFor(type)}`;

  const client = createGlosignClient({ apiKey });
  const file = await client.downloadContractCopy({ contractId, type });

  if (!Buffer.isBuffer(file)) {
    throw new Error("Expected binary file response from Glosign download API.");
  }

  const targetPath = resolve(output);
  writeFileSync(targetPath, file);
  console.log(targetPath);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
