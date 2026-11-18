import { WORKSPACES_PAGE_SIZE } from "../constants/admin.js";
import { appnigma } from "../lib/appnigma.js";
import type { WorkspacePage, WorkspaceRemoval } from "../types/workspace.types.js";

// Every workspace that has connected something, with each connection's status.
// The id is the text this app uses for the workspace: any text up to 255
// characters, spaces and accents included.
const listWorkspaces = async (cursor?: string): Promise<WorkspacePage> => {
  const page = await appnigma.connections.list({ limit: WORKSPACES_PAGE_SIZE, cursor });
  return { workspaces: page.endCustomers, next: page.next };
};

// A workspace that left the product: every connection, link, setting, draft
// and switch of theirs goes. Safe to send again.
const removeWorkspace = async (endCustomerId: string): Promise<WorkspaceRemoval> => appnigma.endCustomers.delete({ endCustomerId });

export { listWorkspaces, removeWorkspace };
