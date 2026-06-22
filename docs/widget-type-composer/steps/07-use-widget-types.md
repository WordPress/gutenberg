# Step 07: use-widget-types

- Branch: `wtc/07-use-widget-types`
- Status: in-progress (production complete and type-validated; JS test deferred to
  CI; awaiting merge)
- Depends on: 01, 05 (on the feature branch)

## Goal

Resolve server-defined records in the client discovery hook. `useWidgetTypes`
keeps trunk's records-param API and built-in behavior, and additionally builds a
`WidgetType` straight from the inline REST fields for code-registered and cpt
records (which ship no script-module).

## What changed

- `packages/widget-primitives/src/hooks/use-widget-types.ts`:
  - `DEFAULT_API_VERSION = 1`, applied to server-defined records (they do not
    emit `apiVersion`; built-in reads it from the imported module).
  - `buildRuntimeFields( record )`: maps the snake-cased server fields shared by
    every origin to camelCase (`name`, `renderModule`, and the optional
    `presentation`/`origin`/`definitionId`/`content`), keeping each optional key
    absent when the server omits it. Used by both branches.
  - The no-`widget_module` branch builds the `WidgetType` from `apiVersion`,
    `title`, optional `description`/`icon`, plus `buildRuntimeFields`, instead of
    returning `null`. The built-in branch now spreads `buildRuntimeFields` over
    the imported module default.
- `packages/widget-primitives/src/hooks/test/use-widget-types.ts`: new. Covers the
  code-registered and cpt server-defined branches, optional-field omission, the
  empty-records and null-loading states.

## Decisions and deviations from the oracle

- Faithful re-derivation of the oracle hook. The change is additive: built-in
  records resolve exactly as before; server-defined records that previously
  dropped to `null` now yield a `WidgetType` carrying `content` and metadata.

## Verification

- typecheck: `node_modules/.bin/tsgo --noEmit -p
  packages/widget-primitives/tsconfig.json` -> exit 0, no errors.
- lint: `node_modules/.bin/eslint
  packages/widget-primitives/src/hooks/use-widget-types.ts` -> clean.
- JS unit test: written, NOT run locally. `npm run test:unit` OOMs this machine
  (the jest harness builds the whole-monorepo module map, ~4GB heap, fatal OOM;
  see the project memory). Deferred to CI. The test asserts the acceptance
  (server-defined records yield a `WidgetType` with `content`; optional fields
  omitted; loading states).
- acceptance (PLAN 07): records with `origin` code-registered/cpt yield a
  `WidgetType` with `content`; built-in unchanged. Held by the type contract
  (tsgo) and the deferred test.

## Follow-ups

- [ ] Confirm the JS test green in CI, then merge into the feature branch.
- [ ] Step 08 (widget-render-routing) is what lets a server-defined widget
  actually render in a dashboard tile: `WidgetRender` currently only resolves the
  built-in `renderModule` and has no origin branch, so a discovered server-defined
  widget is not yet renderable.
