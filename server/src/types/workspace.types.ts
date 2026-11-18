import type { DeleteEndCustomerOutput, EndCustomerEntry } from "@appnigma/sdk";

type WorkspacePage = {
  workspaces: EndCustomerEntry[];
  next: string | null;
};

type WorkspaceRemoval = DeleteEndCustomerOutput;

export type { WorkspacePage, WorkspaceRemoval };
