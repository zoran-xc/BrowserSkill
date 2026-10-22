import type { SessionManager } from "@/session-manager/manager";
import type { RpcError } from "@/transport/types";
import { isRpcError, lookupSession } from "./shared";

type ExtensionMethod =
  | "tool.extensions_list"
  | "tool.extensions_enable"
  | "tool.extensions_disable";
export async function handleExtensions(
  manager: SessionManager,
  method: ExtensionMethod,
  params: { session_id: string; id?: string },
  signal?: AbortSignal,
): Promise<object | RpcError> {
  const ctx = lookupSession(manager, params, "extensions");
  if (isRpcError(ctx)) return ctx;
  if (ctx.remote)
    return { code: "unsupported", message: "Remote sessions cannot manage local extensions" };
  const active = () => !signal?.aborted && manager.get(ctx.sessionId) === ctx;
  try {
    if (!active()) return { code: "cancelled", message: "Cancelled before dispatch" };
    if (!(await chrome.permissions.contains({ permissions: ["management"] })))
      return {
        code: "permission_denied",
        message: "Owner must grant Extension management in the extension popup",
      };
    if (method === "tool.extensions_list") {
      if (params.id !== undefined)
        return { code: "invalid_params", message: "List does not accept an ID" };
      if (!active()) return { code: "cancelled", message: "Cancelled before dispatch" };
      const extensions = (await chrome.management.getAll()).map(
        ({ id, name, version, enabled, type, installType, mayDisable }) => ({
          id,
          name,
          version,
          enabled,
          type,
          installType,
          mayDisable,
        }),
      );
      return { extensions };
    }
    if (typeof params.id !== "string" || !/^[a-p]{32}$/.test(params.id))
      return { code: "invalid_params", message: "Expected a Chrome extension ID" };
    const target = await chrome.management.get(params.id);
    if (
      params.id === chrome.runtime.id ||
      target.type !== "extension" ||
      target.mayDisable === false ||
      target.installType === "admin"
    )
      return {
        code: "permission_denied",
        message: "Cannot modify self, managed or non-extension items",
      };
    if (!active()) return { code: "cancelled", message: "Cancelled before dispatch" };
    switch (method) {
      case "tool.extensions_enable":
        await chrome.management.setEnabled(params.id, true);
        break;
      case "tool.extensions_disable":
        await chrome.management.setEnabled(params.id, false);
        break;
      default:
        return { code: "invalid_params", message: "Unknown extension action" };
    }
    const { id, enabled } = await chrome.management.get(params.id);
    return { id, enabled };
  } catch (error) {
    return {
      code: "protocol_error",
      message: `Extension management failed: ${error instanceof Error ? error.message : String(error)}. If Chrome requires a user gesture or confirmation, ask the owner; inspect state before retrying.`,
    };
  }
}
