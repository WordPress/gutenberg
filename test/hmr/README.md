# HMR / fast-refresh smoke test

End-to-end check that fast refresh actually works. Drives a headless
Chromium against a running WordPress install and verifies:

1. Editing a component source file updates the DOM without a full
   page reload.
2. Introducing a syntax error shows the build-error overlay.
3. Fixing the error hides the overlay and HMR resumes.
4. The runtime-collision canary stays silent (the runtime is tracking
   React roots, i.e. WordPress core didn't override our hook).
5. The SSE disconnect indicator appears within a few seconds of the
   live-reload server going away.

> **Note**: Test 5 deliberately kills the SSE server on port 35729
> (the test runner does this to verify the disconnect badge). After
> the suite finishes, `npm run dev` no longer has its live-reload
> child running. Restart `npm run dev` if you want HMR back.

This is a runtime tooling test — it requires `npm run dev` to be
running against a WordPress install where the Gutenberg plugin is
active. It is not part of the regular e2e suite.

## Running

In one terminal:

```bash
npm run dev
```

Wait for `Watching for changes...`, then in another terminal:

```bash
npm run test:hmr
```

## Configuration

Override via env vars:

| Variable      | Default                | Description                |
| ------------- | ---------------------- | -------------------------- |
| `WP_BASE_URL` | `http://localhost:8888`| WordPress site root.       |
| `WP_USERNAME` | `admin`                | Admin login.               |
| `WP_PASSWORD` | `password`             | Admin password.            |

The defaults match `wp-env`. For Local / MAMP / Valet installs, set
`WP_BASE_URL` (and credentials if they differ).

## What it asserts

Run-by-run output looks like:

```
Test 1: HMR edit updates DOM without reload
  ✓ DOM contains "NavigationHMRTEST"
  ✓ no full reloads
  (took 1793ms)

Test 2: build error shows overlay
  ✓ overlay present
  ✓ error.json written
  ✓ overlay mentions package
  ✓ overlay mentions file path

Test 3: fix error → overlay clears, HMR resumes
  ✓ overlay gone
  ✓ error.json removed
  ✓ HMR works after recovery (DOM contains "NavigationRECOVERY")

Test 4: runtime canary is silent (no WP core collision)
  ✓ canary did not fire

Test 5: disconnect indicator appears after dev:live dies
  ✓ no badge while connected
  ✓ badge appears within 8s of disconnect

OK — full reloads observed: 0
```

The test mutates and restores
`packages/edit-site/src/components/sidebar-navigation-screen-main/index.js`.
On any failure the original content is restored before exit.
