"use strict";

function getGlosignPreflightChecklist(input = {}) {
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
    {
      key: "testModeEnabled",
      label: "Account is confirmed as test-mode enabled",
      ok: Boolean(input.testModeEnabled)
    }
  ];

  if (input.requiresTemplateId) {
    items.push({
      key: "templateId",
      label: "Template ID provided",
      ok: Boolean(input.templateId)
    });
  }

  if (input.requiresClientId) {
    items.push({
      key: "clientId",
      label: "Client ID provided",
      ok: Boolean(input.clientId)
    });
  }

  if (input.requiresCompanyCode) {
    items.push({
      key: "companyCode",
      label: "Company code provided",
      ok: Boolean(input.companyCode)
    });
  }

  if (input.requiresWebhookUrl) {
    items.push({
      key: "webhookUrl",
      label: "Webhook URL provided",
      ok: Boolean(input.webhookUrl)
    });
  }

  return {
    ready: items.every((item) => item.ok),
    items,
    note: "Do not assume separate test and production keys unless official Glosign docs confirm that model."
  };
}

module.exports = {
  getGlosignPreflightChecklist
};
