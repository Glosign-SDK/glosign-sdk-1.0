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

## Minimum User Inputs

Before live sending, the user must complete three actions outside the coding project:

1. create a Glosign business account
2. issue a REST API access token from the Glosign settings/API menu
3. create a prepared template with at least one signer field

The AI coding agent should explicitly guide the user through these steps instead of trying to build a local signing engine.

Ask the user for these values after those actions are complete:

- `GLOSIGN_API_KEY`: issued REST API access token
- `GLOSIGN_TEMPLATE_ID`: prepared template ID
- signer email
- contract title

The prepared template must already contain at least one `sign` or `stamp` field for the signer.

## Minimum Development Tasks

Create a Todo list with these tasks and complete them in order:

1. Install `@glosign/sdk`.
2. Confirm Node.js 18+. Use `import` in ESM projects and `require` in existing CommonJS `server.js` projects.
3. Add server-side environment variables for `GLOSIGN_API_KEY` and `GLOSIGN_TEMPLATE_ID`.
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

CLI shortcuts for the same tasks:

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

After the first cycle is verified, expand in this order:

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
