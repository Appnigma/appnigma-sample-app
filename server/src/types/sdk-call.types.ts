type SdkMethodRoute = {
  httpMethod: string;
  pattern: RegExp;
  name: string;
};

type SdkCallRecord = {
  id: number;
  sdkMethod: string;
  httpMethod: string;
  path: string;
  status: number | null;
  durationMs: number;
  at: string;
};

export type { SdkCallRecord, SdkMethodRoute };
