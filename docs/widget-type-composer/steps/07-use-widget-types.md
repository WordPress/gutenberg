# Step 07: use-widget-types

- Branch: `wtc/07-use-widget-types`
- Status: done
- Depends on: 01, 05 (on the feature branch)

## Goal

Resolve server-defined records in the client discovery hook. `useWidgetTypes`
keeps trunk's records-param API and built-in behavior, and additionally builds a
`WidgetType` straight from the inline REST fields for code-registered and cpt
records (which ship no script-module).

## What changed

- `packages/widget-primitives/src/hooks/use-widget-types.ts`:
  - `recordOverlay( record )` gains the server-defined fields, absent when
    the server omits them: `origin`, `definition_id` -> `definitionId`, and
    `content`.
  - The no-module branch drops a record only when it carries neither a
    `render_module` nor inline `content`, so server-defined records (which
    ship no script-module) resolve from their REST fields.
- `packages/widget-primitives/src/hooks/test/use-widget-types.test.tsx`:
  server-defined cases in trunk's own test file: a code-registered record
  resolves from inline `content`, `definition_id` maps to `definitionId`,
  and none of the three keys appear on a record that does not carry them.

## Decisions and deviations from the oracle

- Faithful re-derivation of the oracle hook. The change is additive: built-in
  records resolve exactly as before; server-defined records that previously
  dropped to `null` now yield a `WidgetType` carrying `content` and metadata.
- 2026-08-19 re-home: WordPress/gutenberg#81738 landed most of this step
  upstream (the no-module resolution, the `apiVersion` defaults, the shared
  `recordOverlay`). The step shrank to the three server-defined fields and
  the content-aware drop guard; the `buildRuntimeFields` rename and the
  separate test file dropped in favor of trunk's shapes.

## Verification

- typecheck: `node_modules/.bin/tsgo --noEmit -p
  packages/widget-primitives/tsconfig.json` -> exit 0, no errors.
- lint: `node_modules/.bin/eslint` on the hook and the test ->
  clean on both files (exit 0).
- JS unit tests: scoped run, green (18 tests, trunk's suite plus the
  server-defined cases):
  `npx jest --config test/unit/jest.config.js packages/widget-primitives/src/hooks`.
  The `npm run test:unit` wrapper still OOMs this machine; scope the run.
- acceptance (PLAN 07): records with `origin` code-registered/cpt yield a
  `WidgetType` with `content`; built-in unchanged. Held by the type contract
  (tsgo) and the tests.

## Follow-ups

- [x] JS tests verified locally with a scoped jest run (2026-08-19 re-home).
- [ ] Step 08 (widget-render-routing) is what lets a server-defined widget
  actually render in a dashboard tile: `WidgetRender` currently only resolves the
  built-in `renderModule` and has no origin branch, so a discovered server-defined
  widget is not yet renderable.
