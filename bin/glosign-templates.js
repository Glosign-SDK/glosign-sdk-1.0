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
  date.setFullYear(date.getFullYear() - 1);
  return formatDate(date);
}

function defaultToDate() {
  return formatDate(new Date());
}

function normalizeTemplates(response) {
  if (Array.isArray(response?.templateList)) {
    return response.templateList;
  }

  if (Array.isArray(response?.results)) {
    return response.results;
  }

  if (Array.isArray(response)) {
    return response;
  }

  return [];
}

function matchesQuery(template, query) {
  if (!query) {
    return true;
  }

  const haystack = [template.id, template.title, template.description, template.state]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query.toLowerCase());
}

async function main() {
  const apiKey = process.env.GLOSIGN_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GLOSIGN_API_KEY");
  }

  const from = getArgValue("--from", defaultFromDate());
  const to = getArgValue("--to", defaultToDate());
  const query = getArgValue("--query", "");
  const json = hasFlag("--json");

  const client = createGlosignClient({ apiKey });
  const response = await client.listTemplates({
    from,
    to,
    start_date: from,
    end_date: to
  });

  const templates = normalizeTemplates(response).filter((template) => matchesQuery(template, query));

  if (json) {
    console.log(
      JSON.stringify(
        {
          from,
          to,
          total: templates.length,
          templates
        },
        null,
        2
      )
    );
    return;
  }

  if (templates.length === 0) {
    console.log(`No templates found for range ${from}-${to}${query ? ` and query "${query}"` : ""}.`);
    return;
  }

  console.log(`Templates ${from}-${to}${query ? ` query="${query}"` : ""}`);
  console.log(
    `${pad("TEMPLATE_ID", 34)} ${pad("TITLE", 28)} ${pad("STATE", 8)} ${pad("RECEIVERS", 9)} UPDATED_AT`
  );

  for (const template of templates) {
    console.log(
      `${pad(template.id, 34)} ${pad(template.title, 28)} ${pad(template.state, 8)} ${pad(template.receiver_count, 9)} ${template.updated_at || ""}`
    );
  }

  console.log("");
  console.log("Use one TEMPLATE_ID as GLOSIGN_TEMPLATE_ID for smoke tests or send flows.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
