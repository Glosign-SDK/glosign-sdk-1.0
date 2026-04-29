# First Glosign Development Cycle

Use this document when any AI coding agent is asked to add electronic signature or digital contract functionality with Glosign. This applies to Codex, Claude, Gemini, Cursor, and other vibe-coding agents.

The first implementation must be intentionally small. Finish one complete general remote-signing cycle before adding advanced signing modes.

## Goal

Build the smallest useful Glosign signing feature:

1. send one prepared template to one email signer
2. show the generated contract ID
3. show the current contract status
4. wait for the signer to complete signing in Glosign
5. show completion status
6. download the completed signed PDF

This is the default path. Do not start with link signing, bulk signing, mobile delivery, webhook automation, template creation UI, or local signature capture unless the user explicitly asks for those after the first cycle works.

## Human Action Boundary

Before live sending, the user must complete only the Glosign-side actions that cannot be done inside the codebase. Keep this list short and do not add command-running tasks:

1. create a Glosign business account from `https://www.glosign.com/`; select the business-member signup type, and do not require business registration number verification for this first setup
2. issue a REST API access token from `기업설정 > API 관리` at `https://admin.glosign.com/token/api` and provide it to the coding agent
3. create one sample prepared template at `https://glosign.com/templates/upload` with at least one signer field
4. provide one signer email address for the first live send test

Direct links:

- Glosign signup: `https://www.glosign.com/`
- API token management: `https://admin.glosign.com/token/api`
- Template creation: `https://glosign.com/templates/upload`

The AI coding agent should explicitly guide the user through these steps instead of trying to build a local signing engine. After the SDK is installed, tell the user to sign up as a business account, issue the API key, send only the API key back to the coding agent, create one simple template with one `sign` or `stamp` field, and provide one signer email address.

Do not give the user a sequence such as `npm run preflight`, `npm run templates`, `npm run send`, `npm run status`, or `npm run download`. Those are agent-owned execution steps. The user should be able to approve the plan, provide the four external inputs above, and let the coding agent proceed while reporting checklist progress.

Do not ask the user to create `.env`, copy `.env.example`, or find `GLOSIGN_TEMPLATE_ID` manually. The agent should create or update the local env file, and the SDK/CLI should look up templates after the API key is available.

Do not include Glosign support-enabled test mode as a required first action. The first smoke test should use the initial free real-send quota. If the user wants API tests that do not deduct from that quota, they can ask Glosign support to enable test mode later.

The only values the coding agent should ask the user to hand back are:

- `GLOSIGN_API_KEY`: issued REST API access token
- signer email

Use a default contract title such as `First Glosign send` unless the user volunteers a different title.

The prepared template must already contain at least one `sign` or `stamp` field for the signer.

## After The User Provides The API Key

Once the user gives the agent `GLOSIGN_API_KEY`, the next response must keep this priority:

1. State that the SDK can now connect to Glosign.
2. Say: "If a template already exists, I will list or inspect it and use it."
3. Create or update the local env file yourself with the API key.
4. Perform template lookup with `glosign-templates` or `client.listTemplates`.
5. If a prepared template exists, select it and set `GLOSIGN_TEMPLATE_ID` yourself.
6. If no prepared template exists, send the user to `https://glosign.com/templates/upload` and ask them to create one template with one `sign` or `stamp` field.
7. Ask for exactly one signer email address for the first live send test.
8. Do not ask about link signing, multi-signer flows, custom PDF signing, webhook architecture, or advanced UI yet.

The first active development milestone is:

## 1A. Live Send Test

This is the highest priority. Do this before any other feature work:

1. Use the provided API key.
2. Locate or confirm one prepared template by API lookup; do not require the user to know the template ID.
3. Ask for one signer email address, preferably the user's own email.
4. Send one general remote-signing contract.
5. Show the generated `contractId`.
6. Have the signer open the Glosign email and complete signing.
7. Poll status until completion.
8. Download the completed signed PDF.

Do not move to UI expansion until 1A succeeds.

## B. Expansion After 1A

Only after 1A succeeds, move to:

1. Multiple receivers.
2. Sequential signing order.
3. Participant validation UI.
4. Send confirmation UI.
5. Contract list/status UI.
6. Webhooks.
7. Mobile delivery.
8. Link signing.
9. Bulk signing.

## Minimum Development Tasks

Create a Todo list with these tasks and complete them in order:

1. Install `@glosign/sdk`.
2. Confirm Node.js 18+. Use `import` in ESM projects and `require` in existing CommonJS `server.js` projects.
3. Create or update the local env file with `GLOSIGN_API_KEY`; add `GLOSIGN_TEMPLATE_ID` after template lookup.
4. Create a server-side Glosign client with `createGlosignClient`.
5. Add a preflight check that validates required inputs before live sending.
6. Add a template lookup or template detail check using `listTemplates` or `getTemplate`.
7. Build the one-signer send payload with `buildOneSignerRemoteSigningPayload`.
8. Send the contract with `sendTemplateContract`.
9. Store or display the returned `contractId`.
10. Add contract status lookup with `getContract`.
11. Add signer completion lookup with `getContractSignInfo`.
12. Treat `contract not complete` as a waiting state, not as a fatal error.
13. Add completed PDF download with `downloadContractCopy({ type: "compDocs" })`.
14. Test the full cycle: send -> signer completes in Glosign -> status complete -> PDF downloads.

Report progress against this checklist as work completes. Do not ask the user to run these commands.

Agent execution helpers for the same tasks:

```bash
GLOSIGN_API_KEY=... GLOSIGN_TEMPLATE_ID=... npx glosign-send-one \
  --signer-email receiver@example.com \
  --contract-name "First Glosign send"

GLOSIGN_API_KEY=... npx glosign-status --id <CONTRACT_ID>
GLOSIGN_API_KEY=... npx glosign-download --id <CONTRACT_ID>
```

## Minimal Code Shape

```js
import { createGlosignClient } from "@glosign/sdk/client";
import { buildOneSignerRemoteSigningPayload } from "@glosign/sdk/recipes";

const client = createGlosignClient({
  apiKey: process.env.GLOSIGN_API_KEY
});

const payload = buildOneSignerRemoteSigningPayload({
  templateId: process.env.GLOSIGN_TEMPLATE_ID,
  contractName: "First Glosign send",
  signerName: "Receiver",
  signerEmail: "receiver@example.com"
});

const sent = await client.sendTemplateContract(payload);
```

For CommonJS `server.js`, use:

```js
const { createGlosignClient } = require("@glosign/sdk/client");
const { buildOneSignerRemoteSigningPayload } = require("@glosign/sdk/recipes");
```

## Success Criteria

The first cycle is complete only when all of these are true:

- a contract was sent through `sendTemplateContract`
- the app shows or stores the `contractId`
- the signer received the Glosign signing request
- the signer completed signing in Glosign
- `getContract` or `getContractSignInfo` reflects completion
- `downloadContractCopy` retrieves the completed signed PDF

A successful send response alone is not enough.

## Expansion After Success

After the first cycle is verified, use this expansion priority:

1. Two or more signers in the same general remote-signing flow.
2. Participant validation UI and send confirmation UI.
3. Contract list and per-contract status screen.
4. Completed PDF download button and file naming.
5. Mobile/KakaoTalk delivery if phone numbers are collected.
6. Webhook handling for automatic completion updates.
7. Template upload or template preparation assistance.
8. Link signing.
9. Bulk signing.

Keep link signing secondary unless the user explicitly requests it. General remote signing should remain the default because it is the primary usage path.
