export interface RemoteSigningCoordValue {
  id?: string;
  data?: string;
  tagKey?: string;
  tagValue?: string;
  [key: string]: unknown;
}

export interface OneSignerRemoteSigningInput {
  templateId: string;
  signerEmail: string;
  contractName?: string;
  signerName?: string;
  message?: string;
  lang?: string;
  expiredDay?: number;
  coord?: RemoteSigningCoordValue[];
}

export interface TemplateSendReceiver {
  signOrderNumber: number;
  name: string;
  email: string;
  lang?: string;
  expired_day?: number;
  message?: string;
  coord?: RemoteSigningCoordValue[];
  userPhone?: string;
  userPhoneCode?: string;
  [key: string]: unknown;
}

export interface TemplateSendContractItem {
  signOrder: boolean;
  isReview: boolean;
  contractName: string;
  receiverList: TemplateSendReceiver[];
  [key: string]: unknown;
}

export interface TemplateSendContractBody {
  templateId: string;
  contractName: string;
  commonMessage?: string;
  emailFlag?: boolean;
  mobileFlag?: boolean;
  contractList: TemplateSendContractItem[];
  [key: string]: unknown;
}

export declare const DEFAULT_REMOTE_SIGNING_FLOW: string[];

export declare function buildOneSignerRemoteSigningPayload(
  input?: OneSignerRemoteSigningInput
): TemplateSendContractBody;
