# Glosign SDK

This repository contains the standalone Glosign Open API SDK and CLI helpers for electronic signature and contract workflows.

## Current status

- `@glosign/sdk` is published on npm as a beta package
- SDK client methods exist for core Glosign workflows
- CLI helpers exist for project scaffolding, template lookup, contract lookup, and completed-file download
- live API send flows still require a Glosign business account, issued REST API Access token, and prepared template

## What this is for

This package makes the intended integration path explicit:

- `createGlosignClient(...)` from `@glosign/sdk/client`
- `getGlosignPreflightChecklist(...)` from `@glosign/sdk/heuristics`
- `glosign-init`

That gives coding agents a concrete default instead of falling back to a custom signature engine.

The package root still re-exports both for convenience, but the preferred public surface is split:

- `@glosign/sdk/client`
- `@glosign/sdk/heuristics`

## License and support

This repository is licensed under [MIT](./LICENSE).

For bugs and feature requests, use the GitHub issue tracker:

- `https://github.com/Glosign-SDK/glosign-sdk-1.0/issues`

For security issues, follow [SECURITY.md](./SECURITY.md).

## Access preflight

Before implementation, confirm:

1. Glosign business account exists
2. API key was issued
3. Glosign support switched the account to test mode
4. Required IDs such as `templateId`, `clientId`, or `companyCode` are available
5. The prepared template has at least one `sign` or `stamp` field before send

Do not assume separate test and production keys unless official Glosign docs confirm that model.

## Installation

```bash
npm install @glosign/sdk@beta
```

## Usage

### SDK

```js
import { createGlosignClient } from "@glosign/sdk/client";
import { getGlosignPreflightChecklist } from "@glosign/sdk/heuristics";

const checklist = getGlosignPreflightChecklist({
  businessAccount: true,
  apiKey: process.env.GLOSIGN_API_KEY,
  testModeEnabled: true,
  requiresTemplateId: true,
  templateId: process.env.GLOSIGN_TEMPLATE_ID
});

if (!checklist.ready) {
  throw new Error("Glosign access is not ready yet.");
}

const client = createGlosignClient({
  apiKey: process.env.GLOSIGN_API_KEY
});

const user = await client.getUser();
console.log(user);
```

### Minimal remote signing

For the first real send test, prefer general remote signing with one receiver:

```js
await client.sendTemplateContract({
  templateId: process.env.GLOSIGN_TEMPLATE_ID,
  contractName: "Glosign API smoke test",
  commonMessage: "Please review and sign.",
  emailFlag: true,
  mobileFlag: false,
  contractList: [
    {
      signOrder: false,
      isReview: false,
      contractName: "Glosign API smoke test",
      receiverList: [
        {
          signOrderNumber: 1,
          name: "Receiver",
          email: "receiver@example.com",
          lang: "kr",
          expired_day: 1,
          message: "Please review and sign.",
          coord: []
        }
      ]
    }
  ]
});
```

Email is the default delivery path. If mobile delivery is enabled, provide `userPhone` and `userPhoneCode` for every receiver. Glosign's product behavior is KakaoTalk by default for mobile delivery; SMS requires a separate option whose OpenAPI payload flag still needs confirmation.

Minimum email-only send inputs:

- REST API Access token
- prepared `templateId`
- contract title
- signer email
- at least one prepared `sign` or `stamp` field in the template
- explicit send confirmation in the calling app

Glosign handles notification delivery, hosted signer signing, signature/stamp capture, server-side storage, and completed output. The integrating app should retrieve status with `GET /contract` and completed files with `GET /docs/contract/download`.

Verify one complete cycle before adding advanced options:

1. create one 일반 비대면서명 request
2. have the signer receive and complete signing through Glosign
3. retrieve completed status and output through the Open API

Do not treat a successful send response alone as full verification.

### Template document upload

`POST /template/temp/create` is exposed as:

```js
import { readFile } from "node:fs/promises";
import { createGlosignClient } from "@glosign/sdk/client";

const client = createGlosignClient({
  apiKey: process.env.GLOSIGN_API_KEY
});

const uploaded = await client.uploadTemplateDocument({
  file: await readFile("examples/assets/glosign-smoke-test-contract.pdf"),
  fileName: "glosign-smoke-test-contract.pdf",
  templateTitle: "Glosign API smoke test"
});

console.log(uploaded);
```

Document upload alone does not prove that signing fields were placed correctly. For a reliable first send, use a template that already has one signature or stamp field for each receiver, ideally on page 1 center for the smoke test.

Template lookup exists through `GET /template/list`, `GET /template/list/company`, and `GET /template`. Those APIs can help confirm which fields are already present. The current public Open API snapshot does not clearly expose an API for creating and saving new signature/stamp fields by arbitrary PDF `x/y` coordinates.

If the user cannot see `templateId` in the Glosign UI, use the bundled CLI:

```bash
GLOSIGN_API_KEY=... npx glosign-templates
```

That command queries `GET /template/list` with a default one-year date range and prints:

- `templateId`
- title
- state
- receiver count
- updated time

Optional filters:

```bash
GLOSIGN_API_KEY=... npx glosign-templates --query "api 테스트"
GLOSIGN_API_KEY=... npx glosign-templates --from 20260101 --to 20261231
GLOSIGN_API_KEY=... npx glosign-templates --json
```

Use the selected `templateId` as `GLOSIGN_TEMPLATE_ID` for smoke tests and send flows.

If no prepared template exists, the fastest product-UI fallback is the authenticated template upload page:

- `https://glosign.com/templates/upload`

The user should log in, upload a test PDF, place one `sign` or `stamp` field, save the template, and provide the resulting `templateId`.

`POST /template/send` supports `coord`, but treat it as data binding for existing template fields:

```js
coord: [
  {
    id: "text_0_0",
    data: "Receiver name",
    tagKey: "name",
    tagValue: "name"
  }
]
```

Do not use `coord` as a confirmed field-placement API until the exact Glosign payload is verified.

Field types confirmed from the public API snapshot include `sign`, `stamp`, `text`, `check`, `drop`, `image`, `hand`, and `date`.

### Frontend send wizard

For browser-facing send screens, the public wizard flow should cover:

1. signing type
2. document selection
3. basic information
4. participants
5. field configuration
6. preview and send confirmation

Keep public examples limited to UX flow, validation, and API mapping. Do not copy Glosign product source or internal coordinate conversion code into public examples.

### CLI

```bash
npx glosign-init --dir /tmp/glosign-starter
```

That generates:

- `.env.example`
- `glosign.client.mjs` as a standalone wrapper that does not depend on a published package
- `README.glosign.md`

Template discovery CLI:

```bash
GLOSIGN_API_KEY=... npx glosign-templates
```

Contract list CLI:

```bash
GLOSIGN_API_KEY=... npx glosign-contracts
```

## Publication preparation

Before publishing a new version, use [PUBLISHING.md](./PUBLISHING.md).

## Smoke checks

Use the repo-local smoke checker before a release candidate:

```bash
npm run smoke:check
```

That verifies the public API surface without making a network call.

To run the live flow, provide the required environment variables and enable live mode:

```bash
GLOSIGN_SMOKE_LIVE=true \
GLOSIGN_API_KEY=... \
GLOSIGN_TEMPLATE_ID=... \
GLOSIGN_SMOKE_SIGNER1_EMAIL=receiver@example.com \
npm run smoke:check -- --live --wait-complete
```

The live path performs:

1. `GET /user`
2. `GET /template`
3. `POST /template/send`
4. `GET /contract`
5. `GET /contract/sign/info`
6. `GET /docs/contract/download`

## Contract status checks

If you already have a `contractId`, inspect the current state with:

```bash
GLOSIGN_API_KEY=... npx glosign-contracts --id ef7367d29fe37f959beb7aa9e1bd46cc97f736c1792167b200c3bea4a9eca41f
```

Add `--sign-info` to include the signer-completion payload when available:

```bash
GLOSIGN_API_KEY=... npx glosign-contracts --id ef7367d29fe37f959beb7aa9e1bd46cc97f736c1792167b200c3bea4a9eca41f --sign-info
```

To list recent contracts when the user does not know the `contractId`:

```bash
GLOSIGN_API_KEY=... npx glosign-contracts
GLOSIGN_API_KEY=... npx glosign-contracts --query "Glosign SDK smoke test"
GLOSIGN_API_KEY=... npx glosign-contracts --from 20260401 --to 20260430
```

The command prints contract ID, title, status, type, and update time so the user can pick one contract and inspect it in detail.

## Download completed files

Once a contract reaches `complete`, download the final output with:

```bash
GLOSIGN_API_KEY=... npx glosign-download --id ef7367d29fe37f959beb7aa9e1bd46cc97f736c1792167b200c3bea4a9eca41f
```

Optional download types:

```bash
GLOSIGN_API_KEY=... npx glosign-download --id ef7367d29fe37f959beb7aa9e1bd46cc97f736c1792167b200c3bea4a9eca41f --type compDocs
GLOSIGN_API_KEY=... npx glosign-download --id ef7367d29fe37f959beb7aa9e1bd46cc97f736c1792167b200c3bea4a9eca41f --type certificate
GLOSIGN_API_KEY=... npx glosign-download --id ef7367d29fe37f959beb7aa9e1bd46cc97f736c1792167b200c3bea4a9eca41f --type attachment
```

Use `--output` to control the destination file path:

```bash
GLOSIGN_API_KEY=... npx glosign-download --id ef7367d29fe37f959beb7aa9e1bd46cc97f736c1792167b200c3bea4a9eca41f --output ./completed-contract.pdf
```
