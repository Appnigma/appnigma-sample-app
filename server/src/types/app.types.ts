type FeaturesOn = {
  portal: boolean;
  sync: boolean;
};

type AppInfo = {
  productName: string;
  brandColor: string;
  accounts: string[];
  signedInAs: string | null;
  callsAvailable: boolean;
  features: FeaturesOn;
};

export type { AppInfo, FeaturesOn };
