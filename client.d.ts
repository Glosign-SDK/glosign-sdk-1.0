export interface GlosignPreflightChecklistItem {
  key: string;
  label: string;
  ok: boolean;
}

export interface GlosignPreflightChecklist {
  ready: boolean;
  items: GlosignPreflightChecklistItem[];
  note: string;
}

export interface CreateGlosignClientOptions {
  apiKey?: string;
  baseUrl?: string;
  v2BaseUrl?: string;
  v19BaseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface UploadTemplateDocumentOptions {
  file: Blob | Buffer | Uint8Array | ArrayBuffer | string;
  fileName?: string;
  templateTitle?: string;
  clientId?: string;
  contentType?: string;
}

export interface DownloadContractCopyOptions {
  contractId: string;
  type?: "compDocs" | "attachment" | "certificate";
}

export interface GlosignClient {
  request(input: {
    version?: "v1" | "v2" | "v1-9";
    routePath: string;
    method?: string;
    query?: Record<string, unknown>;
    body?: unknown;
    formData?: FormData;
    headers?: Record<string, string>;
  }): Promise<any>;
  getUser(): Promise<any>;
  getCompany(): Promise<any>;
  listContracts(params?: Record<string, unknown>): Promise<any>;
  getContract(contractId: string): Promise<any>;
  getContractSignInfo(contractId: string): Promise<any>;
  listTemplates(params?: Record<string, unknown>): Promise<any>;
  listCompanyTemplates(params?: Record<string, unknown>): Promise<any>;
  getTemplate(templateId: string, params?: { clientId?: string }): Promise<any>;
  sendTemplateContract(body: unknown): Promise<any>;
  uploadTemplateDocument(options?: UploadTemplateDocumentOptions): Promise<any>;
  createLinkContract(body: unknown): Promise<any>;
  resendContract(body: unknown): Promise<any>;
  extendContractExpire(body: unknown): Promise<any>;
  downloadContractCopy(options: DownloadContractCopyOptions): Promise<any>;
  getContractPreview(uniq: string): Promise<any>;
}

export declare function createGlosignClient(options?: CreateGlosignClientOptions): GlosignClient;
export declare const defaults: {
  DEFAULT_BASE_URL: string;
  DEFAULT_V2_BASE_URL: string;
  DEFAULT_V19_BASE_URL: string;
};
