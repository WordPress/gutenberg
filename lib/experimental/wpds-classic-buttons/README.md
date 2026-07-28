# WPDS classic buttons (proof of concept)

Makes classic wp-admin buttons (`.wp-core-ui .button`, `.button-primary`, …)
render **identically to the React `Button`** by generating their CSS *from the
React component's own compiled stylesheet* — same implementation, not just the
same tokens. Legacy selectors and markup are preserved. Behind the
`gutenberg-wpds-classic-buttons` experiment; off by default.

## How it works

```
packages/components/build-style/style.css   (React Button, compiled)
                │
                │  generate.mjs  — extract every `.components-button` rule,
                │                  re-scope its selector onto the legacy
                │                  classes per buttons-translation-key.json
                ▼
        buttons.css   (generated; enqueued over Core's buttons in wp-admin)
```

Declarations are copied verbatim, so classic inherits React's exact
constructions — including the transparent-border + `outline`/`outline-offset`
focus ring and the 40px default height. Re-running after a component build
tracks any React change; `--check` is the drift gate.

## Files

| File | Role |
| --- | --- |
| `buttons-translation-key.json` | **The selector map.** React variant/size classes → legacy classes, plus the `scopePrefix`, the forced-40px rule, and the documented `dropped` selectors. Legible single source for the mapping. |
| `generate.mjs` | Extracts + re-scopes the React button rules → `buttons.css`. `--check` drift gate. |
| `buttons.css` | **Generated build artifact** (do not edit). Carries compiled-output traits (baked token fallbacks, `--wp-components-color-*` bridge vars, duplicate selectors), so it is `stylelint-disable`d at the top — it is not hand-authored source. |
| `load.php` | Enqueues `buttons.css` over Core's classic buttons on classic admin screens (experiment-gated). |
| `build-parity-harness.mjs` / `parity-harness.html` | Renders the real React button beside the classic one for direct comparison. |

## Commands

```bash
node lib/experimental/wpds-classic-buttons/generate.mjs           # regenerate
node lib/experimental/wpds-classic-buttons/generate.mjs --check   # drift gate
node lib/experimental/wpds-classic-buttons/build-parity-harness.mjs
```

## Enabling

Settings → Experiments → **Design System classic buttons**, or:

```bash
wp option update gutenberg-experiments '{"gutenberg-wpds-classic-buttons":"1"}' --format=json
```

## Findings surfaced by this POC (for the roadmap)

- **Identical rendering is achievable** for the button's core (primary,
  secondary, default, link, small): verified byte-for-byte on computed styles.
- **The compiled component CSS isn't cleanly portable as source.** It carries
  `--wp-components-color-*` bridge variables (components-package-internal;
  resolve in classic only via their fallback chain to `--wp-admin-theme-color`),
  baked-in token fallbacks, and duplicate selectors. A Core-native version
  should author against `--wpds-*` / `--wp-admin-*` directly.
- **Class-model mismatch.** Classic buttons carry `.button` *and* the variant
  (`.button.button-primary`), whereas React uses a compound `.components-button.is-primary`.
  So `is-secondary` maps to `.button:not(.button-primary)` to avoid bleeding onto
  primary, and foreign components that extend `.components-button` (e.g.
  `.components-guide__back-button`) are dropped.
- **Override, not dequeue.** `buttons` is a hard dependency of the `colors`
  handle, so it can't be cleanly dequeued from a plugin; our file loads after and
  wins. Unmapped cases (hero, `.button-link-delete`, group corners, responsive)
  keep Core's rules. A true dequeue needs a Core change.
- **Single focus-width variable.** Classic reads `--wp-admin-border-width-focus`;
  React reads `--wpds-border-width-focus`. They should collapse to one token, and
  `--wpds-color-stroke-focus` needs a dual role (accent for normal, error-red for
  destructive).

British English is used in user-facing copy.
