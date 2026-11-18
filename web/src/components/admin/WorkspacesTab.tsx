import type { EndCustomerEntry } from "@appnigma/sdk";
import type { WorkspaceRemoval } from "@server-types";
import { useCallback, useEffect, useState } from "react";
import { api, messageOf } from "../../api/client";
import { Notice } from "../Notice";
import { Skeleton } from "../Skeleton";

const removalWords = (removal: WorkspaceRemoval): string => {
  const failed = removal.connections.filter((connection) => connection.outcome === "failed").map((connection) => connection.platform);
  if (removal.completed) return `Everything of ${removal.endCustomerId}'s is gone.`;
  return `Most of ${removal.endCustomerId}'s data is gone, but ${failed.join(", ") || "one step"} could not be removed yet. Remove it again in a minute.`;
};

// Every workspace that has connected something, as connections.list gives
// them, and removing one that left the product.
const WorkspacesTab = () => {
  const [workspaces, setWorkspaces] = useState<EndCustomerEntry[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (cursor?: string) => {
    try {
      const page = await api.workspaces(cursor);
      setWorkspaces((current) => (cursor && current ? [...current, ...page.workspaces] : page.workspaces));
      setNext(page.next);
    } catch (failure) {
      setMessage(messageOf(failure));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // A self-serve page for one workspace, where its people manage their own
  // rules. Each link works once, so it is made when asked for and copied.
  const copySelfServeLink = async (endCustomerId: string) => {
    try {
      const { url } = await api.selfServeLink(endCustomerId);
      await navigator.clipboard.writeText(url);
      setMessage(`A self-serve link for ${endCustomerId} is copied. It works once, for a short while.`);
    } catch (failure) {
      setMessage(messageOf(failure));
    }
  };

  const remove = async (endCustomerId: string) => {
    if (!window.confirm(`Remove ${endCustomerId}? Every connection, setting and custom logic rule of theirs is deleted, and it cannot be undone.`)) return;
    try {
      setMessage(removalWords(await api.removeWorkspace(endCustomerId)));
      await load();
    } catch (failure) {
      setMessage(messageOf(failure));
    }
  };

  return (
    <div className="space-y-4">
      {message && <Notice tone="quiet">{message}</Notice>}
      {!workspaces && <Skeleton className="h-40" />}
      {workspaces && workspaces.length === 0 && <p className="text-slate-500">No workspace has connected anything yet.</p>}
      {workspaces && workspaces.length > 0 && (
        <table className="panel w-full overflow-hidden">
          <thead className="table-head">
            <tr>
              <th className="px-5 py-2.5">Workspace</th>
              <th className="px-5 py-2.5">Connections</th>
              <th className="px-5 py-2.5">Custom logic</th>
              <th className="px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {workspaces.map((workspace) => (
              <tr key={workspace.endCustomerId} className="border-t border-slate-100">
                <td className="px-5 py-3">
                  <p className="font-medium">{workspace.endCustomerId}</p>
                  <p className="font-mono text-[11px] text-slate-400">{workspace.logicFolderKey}</p>
                </td>
                <td className="px-5 py-3 text-slate-600">{workspace.connections.map((connection) => `${connection.platform} (${connection.status.replace("_", " ")})`).join(", ")}</td>
                <td className="px-5 py-3 text-slate-600">{workspace.hasCustomLogic ? "Has their own" : "None"}</td>
                <td className="whitespace-nowrap px-5 py-3 text-right">
                  <button type="button" onClick={() => void copySelfServeLink(workspace.endCustomerId)} className="mr-4 text-xs font-semibold text-slate-600 hover:text-slate-900">
                    Copy self-serve link
                  </button>
                  <button type="button" onClick={() => void remove(workspace.endCustomerId)} className="text-xs font-semibold text-rose-600 hover:text-rose-800">
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {next && (
        <button type="button" onClick={() => void load(next)} className="button-secondary">
          Load more
        </button>
      )}
    </div>
  );
};

export { WorkspacesTab };
