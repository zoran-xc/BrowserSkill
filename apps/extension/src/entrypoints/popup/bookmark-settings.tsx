import { useTranslation } from "@browser-skill/i18n/react";
import { useEffect, useState } from "react";
import { Switch } from "./switch";

export function BookmarkSettings({ management = false }: { management?: boolean }) {
  const permission = management ? "management" : "bookmarks";
  const { t } = useTranslation("extension");
  const title = management ? "Extension management" : t("popup.bookmarks.title");
  const [granted, setGranted] = useState(false);
  const [busy, setBusy] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (typeof chrome === "undefined") return;
    const permissions = chrome.permissions;
    if (!permissions) return;
    let active = true;
    const onAdded = permissions.onAdded as chrome.events.Event<() => void>;
    const onRemoved = permissions.onRemoved as chrome.events.Event<() => void>;
    const read = () => {
      void permissions.contains({ permissions: [permission] }).then(
        (value) => {
          if (active) {
            setGranted(value);
            setBusy(false);
          }
        },
        () => {
          if (active) {
            setFailed(true);
            setBusy(true);
          }
        },
      );
    };
    read();
    onAdded.addListener(read);
    onRemoved.addListener(read);
    return () => {
      active = false;
      onAdded.removeListener(read);
      onRemoved.removeListener(read);
    };
  }, [permission]);

  async function update(value: boolean) {
    setBusy(true);
    setFailed(false);
    try {
      if (value) await chrome.permissions.request({ permissions: [permission] });
      else await chrome.permissions.remove({ permissions: [permission] });
      setGranted(await chrome.permissions.contains({ permissions: [permission] }));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-border/80 bg-card/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={management ? "extension-management" : "bookmark-access"}
          className="text-sm font-medium"
        >
          {title}
        </label>
        <Switch
          id={management ? "extension-management" : "bookmark-access"}
          aria-label={title}
          checked={granted}
          disabled={busy}
          onCheckedChange={(value) => void update(value)}
        />
      </div>
      <p className="text-xs text-foreground/70">
        {management
          ? "Allow listing, enabling and disabling extensions in this profile. Does not install extensions."
          : t("popup.bookmarks.scope")}
      </p>
      {failed && (
        <p role="alert" className="text-xs text-destructive">
          {t("popup.bookmarks.failed")}
        </p>
      )}
    </section>
  );
}
