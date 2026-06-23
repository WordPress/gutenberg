# Step 09: renderer-core

- Branch: `wtc/09-renderer-core`
- Status: done
- Depends on: 08 (on the feature branch)

## Goal

Replace the `AdminBlockRenderer` stub with the real single-tree renderer. It
grammar-parses a widget definition's `content` and walks the nodes, rendering
each registered admin block as its React component (recursing into container
blocks) so the whole composition is one React tree. This is the eventless core;
events, context, read-bindings, and the SSR fallback are layered on by later
steps.

## What changed

- `.../admin-block-renderer/types.ts`: new. `AdminBlockAttribute` (declarative
  attribute: `type`/`enum`/`default`/`prop`), `AdminBlockSpec` (`name`,
  `component`, `attributes`, `supportsInnerBlocks`), `AdminBlockComponentProps`
  (`attributes`, `children`).
- `.../admin-block-renderer/registry.ts`: new. Module-level `Map` of block name
  to `{ spec, component }`; `registerAdminBlock` builds the component through the
  factory once, `getAdminBlock` looks it up.
- `.../admin-block-renderer/create-admin-block.tsx`: new. The eventless factory:
  `buildProps` maps a block's parsed attributes to the wrapped component's props
  (applying each attribute's `default` and `prop` rename) and passes rendered
  inner blocks as `children` for container specs.
- `.../admin-block-renderer/admin-block-renderer.tsx`: replaces the step 08 stub.
  `parse()`s `content` (memoized) and walks the nodes; a registered block renders
  its component, a container recurses, an unregistered block renders nothing
  (step 10 adds its SSR fallback).
- `.../admin-block-renderer/admin-blocks/index.ts`: new. Empty side-effect barrel
  where step 12 registers the bundled `core-admin/*` primitives.
- `.../admin-block-renderer/index.ts`: side-effect imports `./admin-blocks` and
  exports the renderer, the registry functions, and the block-spec types.
- `packages/widget-primitives/package.json`: `sideEffects` set to
  `["**/admin-block-renderer/**"]` so the registration side effects survive
  bundling; declares `@wordpress/block-serialization-default-parser`.
- `packages/widget-primitives/tsconfig.json`: add the
  `block-serialization-default-parser` project reference, for `tsc -b` build
  ordering and consistency with the other consumers of the parser.
- `.../admin-block-renderer/test/admin-block-renderer.tsx`: new. Renders a
  registered block from its attributes, inner blocks for a container, and nothing
  for an unregistered block.
- `.../widget-render/test/widget-render.tsx`: update the step-08 routing test. It
  asserted on the stub's raw-markup text leakage; now that the renderer parses the
  composition, it registers a `test/echo` admin block and asserts that block's
  output, keeping the `resolveWidgetModule` routing assertion.

## Decisions and deviations from the oracle

- Eventless scope. The oracle `createAdminBlock` ships the full stack (the
  event-capable variant, connection runtime, `useWidgetHost`, block context,
  read-bindings, with debug `console.log`s and the binding loop commented out).
  This step ports only the eventless factory; the event variant is step 15,
  context step 11, read-bindings step 13. The debug logging is dropped.
- No block context or SSR fallback yet. The oracle renderer wraps the tree in
  `BlockContextProvider` and renders unregistered nodes through `serializeNode` +
  `SsrFallbackBlock`. Both are out of scope: context is step 11, the SSR fallback
  step 10. Unregistered nodes render `null` for now.
- `AdminBlockSpec` is the eventless subset (`name`/`component`/`attributes`/
  `supportsInnerBlocks`); `actions`, `usesContext`, `providesContext` are added
  by the steps that consume them.
- The parser dependency is declared explicitly. The oracle imports
  `@wordpress/block-serialization-default-parser` without declaring it (relying
  on hoisting); this step adds it to the package `dependencies`, matching the
  package's own convention of declaring its WordPress deps.
- Updating the step-08 routing test is in scope, not scope-widening. That test
  asserted on the stub's raw-markup text leakage; step 09 replaces the stub with
  the real parser, so the consumer test must move to asserting a registered
  block's output. A behavior change owns the tests it breaks.

## Verification

- typecheck: `node_modules/.bin/tsgo --noEmit -p
  packages/widget-primitives/tsconfig.json` -> exit 0.
- lint: `node_modules/.bin/eslint` on the new and changed TS/TSX files -> clean.
- JS unit test: written, NOT run locally (jest OOMs this machine; deferred to
  CI). Asserts the acceptance directly.
- acceptance (PLAN 09): a composition of one registered admin block renders its
  component (the test registers `test/echo` and asserts its output); the
  `sideEffects` allowlist keeps `admin-block-renderer/**` registration imports
  from being tree-shaken.

## Follow-ups

- [ ] Verify the JS unit test runs green in CI.
- [ ] Step 10 replaces the unregistered-node `null` with the per-block SSR
  fallback; step 11 wraps the tree in block context; step 12 fills the
  `admin-blocks` barrel with the `core-admin/*` primitives.
