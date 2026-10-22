import { afterEach, expect, it, vi } from "vitest";
import type { SessionManager } from "@/session-manager/manager";
import { handleExtensions } from "../extensions";

afterEach(() => vi.unstubAllGlobals());
it("requires local ownership and permission; refuses self, managed items and cancellation before writes", async () => {
  const ctx = { sessionId: "s", remote: true };
  const manager = { get: () => ctx } as unknown as SessionManager;
  const target = { id: "a".repeat(32), type: "extension", mayDisable: true, installType: "normal" };
  const contains = vi.fn().mockResolvedValue(false);
  const setEnabled = vi.fn();
  vi.stubGlobal("chrome", {
    permissions: { contains },
    runtime: { id: "b".repeat(32) },
    management: { get: vi.fn(async () => target), setEnabled },
  });
  const call = (signal?: AbortSignal) =>
    handleExtensions(
      manager,
      "tool.extensions_disable",
      { session_id: "s", id: target.id },
      signal,
    );
  expect(await call()).toMatchObject({ code: "unsupported" });
  expect(contains).not.toHaveBeenCalled();
  ctx.remote = false;
  expect(await call()).toMatchObject({ code: "permission_denied" });
  contains.mockResolvedValue(true);
  target.installType = "admin";
  expect(await call()).toMatchObject({ code: "permission_denied" });
  target.installType = "normal";
  target.id = "b".repeat(32);
  expect(await call()).toMatchObject({ code: "permission_denied" });
  target.id = "a".repeat(32);
  expect(await call(AbortSignal.abort())).toMatchObject({ code: "cancelled" });
  expect(setEnabled).not.toHaveBeenCalled();
});
