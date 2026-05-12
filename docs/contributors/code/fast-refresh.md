# Fast refresh

`npm run dev` enables React Fast Refresh: editing a component source
file updates the DOM in place, no full page reload, no lost editor
state (open panels, sidebar selections, partially-typed content all
survive).

## Setup

```bash
npm run dev
```

That's the whole setup. `npm run dev` spawns the live-reload SSE
server alongside `wp-build`, so there's no second terminal to manage.

Then load WordPress as usual and edit any component file. You should
see this in the browser devtools console:

```
[HMR] Connected to SSE server on :35729
[HMR] React components refreshed
```

And this in the `npm run dev` terminal on each rebuild:

```
[react-refresh] 1 transformed (4ms), 2302 cached
✅ edit-site (820ms)
```

## What it works on

- Any WordPress install where the Gutenberg plugin is active —
  `wp-env`, Local, MAMP, Valet, manual installs. No Docker required.
- Both the post editor and the site editor, including the canvas
  iframe (block render code). The iframe shares the parent's React
  reconciler via `createPortal`, so parent-level fast-refresh
  tracking already covers it.
- All ~80 IIFE bundles wp-build produces. The wp-build perf
  improvements that ship alongside HMR (esbuild context cache and
  content-hash transform cache) also benefit anyone running
  `npm run dev` with HMR enabled.

## Limitations

Fast refresh swaps the entire IIFE bundle on every change, which
re-runs every module's top-level side effects (`registerStore`,
`registerBlockType`, `wp.hooks.addAction`, etc.). You'll see warnings
like `Store "core/edit-site" is already registered`. After many edits
in a single session, expect:

- Memory growth in the browser. Hard reload to clear.
- Occasional "weird state only after a few edits" bugs. Hard reload
  fixes them — the underlying source state is fine, the runtime state
  isn't.

True module-level HMR (only re-running the changed module) is a
larger architectural change that is **not** part of this pipeline.

## Build errors

When a build fails, the dev terminal shows the esbuild error and the
browser shows a fixed-position overlay with the package name, the
message, and the `file:line:column`:

```
[HMR build error] edit-site

Build failed with 1 error:
packages/edit-site/src/components/.../index.js:25:0:
ERROR: Unexpected "}"
```

The overlay disappears on the next successful rebuild and HMR resumes.

## How it works

The pieces, briefly:

- **`bin/live-reload.mjs`** — small SSE server on `:35729` watching
  `build/`. Pushes changed-file lists. Writes a sentinel file at
  `build/hmr/.live` (containing the port) so PHP knows to inject the
  runtime; re-writes it whenever it goes missing.
- **`lib/dev-hmr.php`** — loaded from `gutenberg.php`. Checks for the
  sentinel and injects `<script>` tags for the runtime and HMR client
  into `wp_head` (frontend) and `admin_print_scripts` priority 1
  (admin). The admin hook timing matters: `admin_head` fires *after*
  scripts are printed, which would put our runtime after React.
- **`bin/hmr/build-runtime.mjs`** — bundles `react-refresh/runtime`
  and sets `window.__hmr_runtime` plus `window.__reactRefreshInjected`
  to suppress WordPress core's own runtime entry.
- **`packages/wp-build/lib/react-refresh-plugin.mjs`** — esbuild
  plugin that runs `react-refresh/babel` on each source file and
  injects per-file `$RefreshReg$` / `$RefreshSig$` bindings. Caches
  by content hash so unchanged files skip babel entirely.
- **`bin/hmr/hmr-client.js`** — receives SSE events, fetches each
  updated bundle via a new `<script>` tag, calls
  `runtime.performReactRefresh()`. Falls back to a full reload if
  refresh isn't possible.

## Disabling

Set `GUTENBERG_HMR=0` to opt out of HMR entirely:

```bash
GUTENBERG_HMR=0 npm run dev
```

## Testing

A smoke test lives at `test/hmr/`. With `npm run dev` running:

```bash
npm run test:hmr
```

It edits a real source file, confirms the DOM updates without a full
reload, verifies the build-error overlay, and restores the file.
See [`test/hmr/README.md`](../../../test/hmr/README.md) for details.

## Troubleshooting

**`[HMR] WordPress is loading minified bundles` in the console.**
Your install has `SCRIPT_DEBUG=false`, so WordPress loads
`index.min.js` (no HMR transforms) instead of `index.js`. Add this
to `wp-config.php`:

```php
define( 'SCRIPT_DEBUG', true );
```

`wp-env` does this for you by default. For Local / MAMP / Valet
installs you may need to set it explicitly.

**A red `⚠ HMR disconnected` badge appears in the corner.** The
live-reload SSE server died — file saves are not reaching the
browser. Restart `npm run dev`.

**`[HMR] runtime is loaded but tracking 0 React roots — fast refresh
will not work` in the console.** WordPress core re-injected its own
react-refresh runtime after ours and overwrote our hook handlers.
Check that `bin/hmr/build-runtime.mjs` still sets
`window.__reactRefreshInjected=true`, and that WP's
`react-refresh-entry.js` still gates its injection on that flag.

**The page reloads instead of hot-updating.** Check the browser
console: `[HMR] performReactRefresh() returned null` means components
weren't registered. Look at the dev terminal for the `[react-refresh]`
heartbeat — if `cached` is 0 after the first rebuild, the cache has
broken; restart `npm run dev`.

**`[HMR] Connected to SSE server on :35729` never appears.** Check
that `lib/dev-hmr.php` printed our `<script>` tag in the head:

```bash
curl -s "$WP_URL/wp-admin/site-editor.php" | grep 'localhost:35729'
```

If nothing prints, the sentinel file was deleted between live-reload's
startup and the page request. Check that `build/hmr/.live` exists
(`cat build/hmr/.live` should print `35729`). The sentinel is
re-written every second, so this usually self-heals; if it doesn't,
check that `gutenberg.php` still includes `lib/dev-hmr.php`.

**`Port 35729 is already in use`.** Another `npm run dev` (or a
standalone `npm run dev:live`) is running. Find and kill it:

```bash
lsof -ti :35729 | xargs kill
```
