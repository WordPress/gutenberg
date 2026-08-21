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
        buttons.css   (generated; replaces Core's buttons.css in wp-admin)
```

Declarations are copied verbatim, so classic inherits React's exact
constructions — including the transparent-border + `outline`/`outline-offset`
focus ring and the 40px default height. Re-running after a component build
tracks any React change; `--check` is the drift gate.

## Files

| File | Role |
| --- | --- |
| `buttons-translation-key.json` | **The selector map.** React variant/size classes → legacy classes, plus the `scopePrefix`, the forced-40px rule, the class-form state maps, and the documented `dropped` selectors. Legible single source for the mapping. |
| `generate.mjs` | Extracts + re-scopes the React button rules → `buttons.css`. `--check` drift gate. |
| `buttons.css` | **Generated build artifact** (do not edit). Carries compiled-output traits (baked token fallbacks, `--wp-components-color-*` bridge vars, duplicate selectors), so it is `stylelint-disable`d at the top — it is not hand-authored source. |
| `buttons-exceptions.css` | **The to-do list.** Hand-authored classic-only rules the generator cannot produce, grouped by why they resist automation, each with the condition that would let us delete it. Should shrink over time. |
| `load.php` | Dequeues Core's `buttons` stylesheet and enqueues `buttons.css` plus `buttons-exceptions.css` in its place on classic admin screens (experiment-gated). |
| `build-parity-harness.mjs` / `parity-harness.html` | Renders the real React button beside the classic one, plus the class-driven states and a table of the classic-only exceptions. View over HTTP, not `file://`. |

## Commands

```bash
npm run wpds:classic-buttons         # regenerate buttons.css from the React source
npm run wpds:classic-buttons:check   # drift gate — non-zero exit if out of sync
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
- **Classic drives state from classes, not just pseudo-classes.** Legacy admin JS
  toggles `.hover` / `.focus` / `.disabled` / `.button-disabled` /
  `.button-primary-disabled` directly, a concept React has no equivalent for. The
  generator now emits the class form alongside the pseudo form from the *same*
  declarations (`stateClassMap`), so these states render identically rather than
  merely existing. `:active` is deliberately **not** mapped to `.active`: in
  classic they are different states — `:active` is transient mouse-down, `.active`
  is a persistent "selected setting" — and conflating them would silently break
  every segmented control.
- **Re-scoping through `:is()` inflates specificity above Core's originals**, which
  silently defeats lower-specificity legacy selectors. This bit twice: `.button-hero`
  was forced to 40px by the generated height rule despite the exceptions file asking
  for 48px, and a bare `.button-disabled` lost its colour to the re-scoped base rule.
  Both were caught by the parity harness, neither by lint or the drift gate. Fixes:
  every size the forced-height rule must not touch has to be listed in its `:not()`
  chain, and variant state classes are *appended* to the mapped subject rather than
  emitted bare. Any future re-scoping needs the same specificity check.
- **Classic has button sizes the design system does not.** `.button-compact` is the
  sharpest case: the key maps React's `is-compact` onto it, but React carries no
  compact height rule, so nothing generates. `.button-hero` (48px) and
  `.button-large` have no React counterpart either. Addressing this properly means
  giving the React `Button` the missing sizes — a design-system change to make
  alongside this work, not inside it.
- **Dequeue needs dependency-graph surgery.** `wp_dequeue_style( 'buttons' )`
  alone is ignored: Core registers `buttons` as a hard dependency of the `colors`
  handle, so the resolver re-adds it. We strip `buttons` from every registered
  handle's dependency list first, then dequeue — after which classic genuinely
  runs the generated stylesheet rather than layering over Core's. A real Core
  rollout should re-author `buttons.css` from tokens so none of this is needed.
- **The dequeue leaves coverage gaps.** Because Core's `buttons.css` is fully
  removed, classic-only rules this file doesn't emit lose their styling:
  `.button-hero`, `.button-link-delete` (the red), the `@media (max-width: 782px)`
  responsive sizing, the `.button.active` pressed state, and `.dashicons` sizing
  inside buttons. The 32px classic variants that carry no `.button-compact` class
  also need a mapping decision. Port these before any wider rollout.
- **Single focus-width variable.** Classic reads `--wp-admin-border-width-focus`;
  React reads `--wpds-border-width-focus`. They should collapse to one token, and
  `--wpds-color-stroke-focus` needs a dual role (accent for normal, error-red for
  destructive).

British English is used in user-facing copy.
