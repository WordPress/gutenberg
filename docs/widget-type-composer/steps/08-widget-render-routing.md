# Step 08: widget-render-routing

- Branch: `wtc/08-widget-render-routing`
- Status: done
- Depends on: 07 (on the feature branch)

## Goal

Make `WidgetRender` a host-agnostic entry point for any widget type by branching
on `origin`. Server-defined types (code-registered, cpt) route to
`AdminBlockRenderer`; built-in types keep resolving their `renderModule` through
the host's `resolveWidgetModule`. `AdminBlockRenderer` is a stub here, just
enough to prove the routing; step 09 replaces it with the single-tree renderer.

## What changed

- `packages/widget-primitives/src/components/widget-render/widget-render.tsx`:
  branch on `widgetType.origin`. When it is set and not `built-in`, render
  `<AdminBlockRenderer content attributes />`; otherwise the unchanged built-in
  path. `attributes` pass through as-is.
- `packages/widget-primitives/src/components/admin-block-renderer/admin-block-renderer.tsx`:
  new stub. Renders the composition `content` as text so a routed widget is
  observable. Declares the `content` + `attributes` prop shape step 09 keeps.
- `packages/widget-primitives/src/components/admin-block-renderer/index.ts`: new.
  Exports `AdminBlockRenderer`.
- `packages/widget-primitives/src/index.ts`: re-export `AdminBlockRenderer` from
  the package root.
- `packages/widget-primitives/src/components/widget-render/test/widget-render.tsx`:
  new. Asserts the routing: a code-registered type reaches the renderer and skips
  `resolveWidgetModule`; a built-in type goes through the resolver.

## Decisions and deviations from the oracle

- No `getSchemaDefaults` merge. The oracle seeds `effectiveAttributes` with
  `getSchemaDefaults( widgetType )` before the instance values. That merge was
  reverted in the shipped design (bound-attribute defaults live in the block
  markup, resolved at render through the null-binding fallback), and the tool
  does not exist on the feature branch. `WidgetRender` passes `attributes`
  through unchanged.
- `AdminBlockRenderer` is a deliberate stub. The oracle's component is the full
  single-tree renderer (steps 09-21: registry, block walk, SSR fallback, context,
  connections). This step ships only the routing seam and a text stub; the real
  renderer lands in step 09 at the same path.
- Minimal package export. Only `AdminBlockRenderer` is re-exported, not the
  oracle's full surface (`registerAdminBlock`, `WidgetHostProvider`,
  `useWidgetHost`, the renderer types). Those land with the steps that introduce
  them.

## Verification

- typecheck: `node_modules/.bin/tsgo --noEmit -p
  packages/widget-primitives/tsconfig.json` -> exit 0.
- lint: `node_modules/.bin/eslint` on the new and changed TS/TSX files -> clean.
- JS unit test: written, NOT run locally. `npm run test:unit` OOMs this machine
  (the jest harness builds the whole-monorepo module map, ~4GB heap). Deferred to
  CI. The test asserts the acceptance directly.
- acceptance (PLAN 08): a code-registered widget reaches the stub renderer (its
  `content` is surfaced and `resolveWidgetModule` is not called); the built-in
  path is unchanged (still resolved through `resolveWidgetModule`).

## Follow-ups

- [ ] Verify the JS unit test runs green in CI.
- [ ] Step 09 replaces `admin-block-renderer.tsx` with the real single-tree
  renderer; the test's content-text assertion then becomes a parsed-block
  assertion.
