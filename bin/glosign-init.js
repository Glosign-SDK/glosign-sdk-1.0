#!/usr/bin/env node

import fs from "fs";
import path from "path";

function printHelp() {
  console.log(`Glosign init scaffold

Usage:
  glosign-init [--dir <path>] [--force]

Options:
  --dir <path>   Target directory. Defaults to current working directory.
  --force        Overwrite existing generated files.
  --help         Show this message.

Notes:
  - This generates a project-local Glosign starter wrapper.
  - @glosign/sdk is published on npm as a beta package.
  - Ask the user for a Glosign business account, issued REST API Access token, and prepared template before live sending.
`);
}

function parseArgs(argv) {
  const parsed = {
    dir: process.cwd(),
    force: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }

    if (arg === "--force") {
      parsed.force = true;
      continue;
    }

    if (arg === "--dir") {
      const value = argv[index + 1];
      if (!value) {
        throw new Error("Missing value for --dir");
      }
      parsed.dir = path.resolve(value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return parsed;
}

function ensureDir(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function writeFile(targetPath, content, force) {
  if (fs.existsSync(targetPath) && !force) {
    throw new Error(`Refusing to overwrite existing file: ${targetPath}`);
  }
  fs.writeFileSync(targetPath, content, "utf8");
}

function buildEnvExample() {
  return `GLOSIGN_API_KEY=replace-with-issued-rest-api-access-token
GLOSIGN_BASE_URL=https://api.glosign.com/v1
GLOSIGN_V2_BASE_URL=https://api.glosign.com/v2
GLOSIGN_V1_9_BASE_URL=https://api.glosign.com/v1-9
GLOSIGN_TEMPLATE_ID=replace-if-needed
GLOSIGN_TEMPLATE_FILE=examples/assets/glosign-smoke-test-contract.pdf
GLOSIGN_TEMPLATE_TITLE=Glosign API smoke test
GLOSIGN_CLIENT_ID=replace-if-needed
GLOSIGN_COMPANY_CODE=replace-if-needed
GLOSIGN_WEBHOOK_URL=https://example.com/api/glosign/webhook
GLOSIGN_SMOKE_SIGNER_COUNT=1
GLOSIGN_SMOKE_SIGNER1_EMAIL=receiver@example.com
GLOSIGN_SMOKE_SIGNER1_PHONE=
GLOSIGN_SMOKE_SIGNER2_EMAIL=
GLOSIGN_SMOKE_SIGNER2_PHONE=
GLOSIGN_SMOKE_SEND_MOBILE=false
GLOSIGN_SMOKE_SEND_SMS=false
`;
}

function buildClientModule() {
  return `function getGlosignPreflightChecklist(input = {}) {
  const items = [
    {
      key: "businessAccount",
      label: "Glosign business account created",
      ok: Boolean(input.businessAccount)
    },
    {
      key: "apiKey",
      label: "Issued API key provided",
      ok: Boolean(input.apiKey)
    },
  ];

  return {
    ready: items.every((item) => item.ok),
    items
  };
}

function buildUrl(baseUrl, routePath, query = {}) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : \`\${baseUrl}/\`;
  const normalizedRoutePath = routePath.startsWith("/") ? routePath.slice(1) : routePath;
  const url = new URL(normalizedRoutePath, normalizedBaseUrl);
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
  return url;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok) {
    const text = await response.text();
    throw new Error(\`Glosign request failed: \${response.status} \${text}\`);
  }

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  return Buffer.from(await response.arrayBuffer());
}

export function createProjectGlosignClient() {
  const checklist = getGlosignPreflightChecklist({
    businessAccount: true,
    apiKey: process.env.GLOSIGN_API_KEY,
  });

  if (!checklist.ready) {
    const missing = checklist.items.filter((item) => !item.ok).map((item) => item.label);
    throw new Error(\`Glosign preflight incomplete: \${missing.join(", ")}\`);
  }

  const apiKey = process.env.GLOSIGN_API_KEY;
  const baseUrl = process.env.GLOSIGN_BASE_URL || "https://api.glosign.com/v1";
  const v2BaseUrl = process.env.GLOSIGN_V2_BASE_URL || "https://api.glosign.com/v2";
  const v19BaseUrl = process.env.GLOSIGN_V1_9_BASE_URL || "https://api.glosign.com/v1-9";

  async function request({ version = "v1", routePath, method = "GET", query, body, formData }) {
    const selectedBaseUrl =
      version === "v2" ? v2BaseUrl : version === "v1-9" ? v19BaseUrl : baseUrl;

    const headers = {
      Authorization: \`Bearer \${apiKey}\`
    };

    let requestBody;
    if (formData !== undefined) {
      requestBody = formData;
    } else if (body !== undefined) {
      requestBody = JSON.stringify(body);
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(buildUrl(selectedBaseUrl, routePath, query), {
      method,
      headers,
      ...(requestBody !== undefined ? { body: requestBody } : {})
    });

    return parseResponse(response);
  }

  return {
    request,
    getUser() {
      return request({ routePath: "/user" });
    },
    getContract(contractId) {
      return request({ routePath: "/contract", query: { id: contractId } });
    },
    sendTemplateContract(body) {
      return request({ routePath: "/template/send", method: "POST", body });
    },
    uploadTemplateDocument({ file, fileName = "glosign-template.pdf", templateTitle, clientId } = {}) {
      if (!file) {
        throw new Error("Missing file for template upload.");
      }

      const formData = new FormData();
      const filePart = file instanceof Blob ? file : new Blob([file], { type: "application/pdf" });
      formData.append("templateFiles", filePart, fileName);

      if (templateTitle) {
        formData.append("templateTitle", templateTitle);
      }

      if (clientId) {
        formData.append("clientId", clientId);
      }

      return request({
        version: "v1-9",
        routePath: "/template/temp/create",
        method: "POST",
        formData
      });
    },
    createLinkContract(body) {
      return request({ routePath: "/template/create/link", method: "POST", body });
    },
    downloadContractCopy({ contractId, type = "compDocs" }) {
      return request({
        routePath: "/docs/contract/download",
        query: { id: contractId, type }
      });
    }
  };
}
`;
}

function buildReadme() {
  return `# Glosign Starter

## Installation report for coding agents

After installing \`@glosign/sdk\`, report these facts to the user before coding:

- the SDK is installed and supports Node.js 18+ ESM and CommonJS
- the first supported implementation is one-signer general remote signing by email
- the user must complete Glosign business signup, API key issuance, and template creation
- Glosign handles signer notification, hosted signing, completion storage, and completed-file retrieval
- the app should first implement send, status check, signer completion check, and completed PDF download

Create a Todo list and finish 1A live send test before adding two-signers, mobile delivery, link signing, or template creation.

## Required Glosign-side setup

The user must do these outside the coding project:

1. Sign up as a Glosign business account.
2. Issue a REST API access token from the Glosign settings/API menu.
3. Create a prepared template with at least one \`sign\` or \`stamp\` field.

## Access checklist

Before implementation, confirm:

1. Glosign business account is created
2. REST API Access token is issued
3. A prepared template is created with at least one sign or stamp field
4. Required IDs such as template ID, client ID, or company code are available

Do not require Glosign support-enabled test mode for the first implementation. The first smoke test can use Glosign's initial free real-send quota. Ask for test mode later only when the user wants API calls that do not deduct from that quota.

## After the user provides the API key

Once the user provides \`GLOSIGN_API_KEY\`, respond in this order:

1. Say that the app can now connect to Glosign.
2. Say: "If a template already exists, I will list or inspect it and use it."
3. Ask for exactly one signer email address for the first live send test.
4. Prioritize 1A live send test above all other work.

## 1A live send test

This is the first development milestone and must happen before UI expansion:

1. Validate access with \`GET /user\`.
2. Find or confirm a prepared template with \`GET /template/list\` or \`GET /template\`.
3. Send one 일반 비대면서명 request to the user's own email if possible.
4. Show the returned contract ID and initial send status.
5. Wait for the signer to complete signing in Glosign.
6. Inspect status with \`GET /contract\`.
7. Check signer completion with \`GET /contract/sign/info\`.
8. Download the completed output with \`GET /docs/contract/download\`.

## Default first cycle

1. Validate access with \`GET /user\`.
2. Find or confirm a prepared template with \`GET /template/list\` or \`GET /template\`.
3. Use 일반 비대면서명 with one signer and email delivery.
4. Send a template-based contract with \`POST /template/send\`.
5. Show the returned contract ID and initial send status.
6. Inspect status with \`GET /contract\`.
7. Check signer completion with \`GET /contract/sign/info\`.
8. After the signer completes in Glosign, download the completed output with \`GET /docs/contract/download\`.

Email is required. Phone is required only when mobile delivery is enabled. Glosign mobile delivery defaults to KakaoTalk; SMS needs the exact Open API payload option confirmed before implementation.

If a source document must be uploaded first, use \`POST /template/temp/create\`. The uploaded PDF still needs a Glosign signing field for each signer before a reliable send.

Do not start with link signing unless the user explicitly asks for link signing. The first implementation should not include custom signature capture, PDF signing, or canvas signing.

## Example

\`\`\`js
import { createProjectGlosignClient } from "./glosign.client.mjs";

const client = createProjectGlosignClient();
const user = await client.getUser();
console.log(user);
\`\`\`
`;
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  ensureDir(args.dir);
  writeFile(path.join(args.dir, ".env.example"), buildEnvExample(), args.force);
  writeFile(path.join(args.dir, "glosign.client.mjs"), buildClientModule(), args.force);
  writeFile(path.join(args.dir, "README.glosign.md"), buildReadme(), args.force);

  console.log(`Generated Glosign starter files in ${args.dir}`);
}

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
