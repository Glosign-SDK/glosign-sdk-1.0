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

export declare function getGlosignPreflightChecklist(input?: {
  businessAccount?: boolean;
  apiKey?: unknown;
  requiresTestMode?: boolean;
  testModeEnabled?: boolean;
  requiresTemplateId?: boolean;
  templateId?: unknown;
  requiresClientId?: boolean;
  clientId?: unknown;
  requiresCompanyCode?: boolean;
  companyCode?: unknown;
  requiresWebhookUrl?: boolean;
  webhookUrl?: unknown;
}): GlosignPreflightChecklist;
