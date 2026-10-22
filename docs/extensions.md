# Local extension management (fork)

This fork follows Tencent/BrowserSkill main 6214e3d (MIT). It carries the optional
bookmark API from upstream PR #434 and a small optional management API.

Owner opens the popup and grants **Extension management**. Off by default;
revocation is checked on each call. It covers the entire selected local profile.

```
bsk extensions --session <owned-local-session> list --json
bsk extensions --session <owned-local-session> disable <extension-id> --json
bsk extensions --session <owned-local-session> enable <extension-id> --json
```

Self, managed extensions and non-extension items cannot be changed. Native errors
and user-gesture requirements remain errors; inspect state before retrying. No
management command grants permissions, installs, or uninstalls an extension.
Actual CfT testing found uninstall requires a native user gesture. The owner
must remove an extension in chrome://extensions and confirm. Store/internal-page
protections are unchanged. Do not use a debugger gesture flag to evade them.

Build CLI with `BSK_FORK_BUILD=1 cargo build --locked --release -p bsk`; this
compile-time opt-in disables upstream periodic and explicit updates for this
installation. Normal upstream builds retain normal update behavior. This keeps
the patch minimal and upstream-rebaseable. Build the matched extension using
`pnpm ext:build`. Owner loads/reloads the unpacked extension manually.

For unattended tests only, use Chrome for Testing / Chromium with a disposable
user-data-dir and --load-extension. It is not the owner's logged-in Chrome.
Chrome branded builds 137+ removed that switch. Chrome Web Store API updates
require a registered publisher, authenticated OAuth/service account, a prepared
listing/visibility, and review. No publisher account is created by this fork.
