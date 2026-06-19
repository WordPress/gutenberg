# Step 01 — js-contract

- Branch: `wtc/01-js-contract`
- Status: done
- Depends on: none

## Goal

Extend the JS widget contract so server-defined origins (code-registered, cpt)
can be described by the types. Pure types; no runtime change.

## What changed

- `packages/widget-primitives/src/types.ts`:
  - `WidgetType`: added `origin` (`'built-in' | 'code-registered' | 'cpt'`),
    `definitionId` (cpt post ID), `content` (inline composition markup).
  - `WidgetModuleRecord` (the snake_case `/wp/v2/widget-modules` wire shape):
    added `origin`, `definition_id`, `content`, `title`, `description`, `icon`.

## Decisions and deviations from the oracle

- Matches the oracle's shape. Every field is optional, so existing built-in
  consumers and records are unaffected and the change is inert at runtime.

## Verification

- typecheck: `node_modules/.bin/tsgo --noEmit -p packages/widget-primitives/tsconfig.json` clean.
- acceptance: tsgo clean; types-only, no behavior added.

## Follow-ups

- Step 07 (`use-widget-types`) maps these at the JS boundary (snake_case to
  camelCase) and builds server-defined `WidgetType`s.
