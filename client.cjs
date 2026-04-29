"use strict";

const { Buffer } = require("node:buffer");

const DEFAULT_BASE_URL = "https://api.glosign.com/v1";
const DEFAULT_V2_BASE_URL = "https://api.glosign.com/v2";
const DEFAULT_V19_BASE_URL = "https://api.glosign.com/v1-9";

function compactObject(input = {}) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

function buildUrl(baseUrl, routePath, query = {}) {
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
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
    const error = new Error(`Glosign request failed: ${response.status} ${text}`);
    error.status = response.status;
    error.body = text;
    throw error;
  }

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  return Buffer.from(await response.arrayBuffer());
}

function createMultipartFormData() {
  if (typeof globalThis.FormData !== "function") {
    throw new Error("FormData is required. Use Node 18+ or pass a custom upload implementation.");
  }

  return new globalThis.FormData();
}

function createBlobPart(file, contentType) {
  if (typeof globalThis.Blob === "function" && file instanceof globalThis.Blob) {
    return file;
  }

  if (
    typeof file === "string" ||
    Buffer.isBuffer(file) ||
    file instanceof Uint8Array ||
    file instanceof ArrayBuffer
  ) {
    if (typeof globalThis.Blob !== "function") {
      throw new Error("Blob is required for Buffer uploads. Use Node 18+.");
    }

    return new globalThis.Blob([file], {
      type: contentType || "application/pdf"
    });
  }

  throw new Error("Unsupported file value. Pass a Blob, Buffer, Uint8Array, ArrayBuffer, or string.");
}

function createGlosignClient(options = {}) {
  const {
    apiKey = "",
    baseUrl = DEFAULT_BASE_URL,
    v2BaseUrl = DEFAULT_V2_BASE_URL,
    v19BaseUrl = DEFAULT_V19_BASE_URL,
    fetchImpl = globalThis.fetch
  } = options;

  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required. Use Node 18+ or pass fetchImpl.");
  }

  async function request({
    version = "v1",
    routePath,
    method = "GET",
    query,
    body,
    formData,
    headers = {}
  }) {
    if (!apiKey) {
      throw new Error("Missing apiKey");
    }

    const selectedBaseUrl =
      version === "v2" ? v2BaseUrl : version === "v1-9" ? v19BaseUrl : baseUrl;

    const url = buildUrl(selectedBaseUrl, routePath, query);
    const init = {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...headers
      }
    };

    if (formData !== undefined) {
      init.body = formData;
    } else if (body !== undefined) {
      init.body = JSON.stringify(body);
      init.headers["Content-Type"] = "application/json";
    }

    const response = await fetchImpl(url, init);
    return parseResponse(response);
  }

  return {
    request,
    getUser() {
      return request({ routePath: "/user" });
    },
    getCompany() {
      return request({ routePath: "/user/company" });
    },
    listContracts(params = {}) {
      return request({ routePath: "/contract/list", query: compactObject(params) });
    },
    getContract(contractId) {
      return request({ routePath: "/contract", query: { id: contractId } });
    },
    getContractSignInfo(contractId) {
      return request({ routePath: "/contract/sign/info", query: { id: contractId } });
    },
    listTemplates(params = {}) {
      return request({ routePath: "/template/list", query: compactObject(params) });
    },
    listCompanyTemplates(params = {}) {
      return request({ routePath: "/template/list/company", query: compactObject(params) });
    },
    getTemplate(templateId, params = {}) {
      return request({
        routePath: "/template",
        query: compactObject({
          id: templateId,
          clientid: params.clientId,
          clientId: params.clientId
        })
      });
    },
    sendTemplateContract(body) {
      return request({
        routePath: "/template/send",
        method: "POST",
        body
      });
    },
    uploadTemplateDocument({
      file,
      fileName = "glosign-template.pdf",
      templateTitle,
      clientId,
      contentType = "application/pdf"
    } = {}) {
      if (!file) {
        throw new Error("Missing file for template upload.");
      }

      const formData = createMultipartFormData();
      formData.append("templateFiles", createBlobPart(file, contentType), fileName);

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
      return request({
        routePath: "/template/create/link",
        method: "POST",
        body
      });
    },
    resendContract(body) {
      return request({
        routePath: "/contract/resend",
        method: "POST",
        body
      });
    },
    extendContractExpire(body) {
      return request({
        routePath: "/contract/extend/expire",
        method: "POST",
        body
      });
    },
    downloadContractCopy({ contractId, type = "compDocs" }) {
      return request({
        routePath: "/docs/contract/download",
        query: {
          id: contractId,
          type
        }
      });
    },
    getContractPreview(uniq) {
      return request({
        version: "v1-9",
        routePath: `/contract/${uniq}/preview`
      });
    }
  };
}

const defaults = {
  DEFAULT_BASE_URL,
  DEFAULT_V2_BASE_URL,
  DEFAULT_V19_BASE_URL
};

module.exports = {
  createGlosignClient,
  defaults
};
