# Packages, APIs, blocks, and compatibility

Use this reference for public exports, package layering, types, metadata, block
serialization, transforms, Block Supports, and WordPress compatibility.

## Public contracts

- Before changing a public function, component, selector, block, or package,
  inventory consumers and preserve names, arguments, return types, props,
  accepted values, context behavior, and durable stored representations.
- Expose only deliberate documented APIs. Use private/plugin-only mechanisms
  for unsettled internals; do not introduce new `__experimental` or
  `__unstable` APIs. Deprecate legacy experimental APIs that already shipped.
- External consumers must use documented public APIs. Cross-package private
  access inside the repository must follow `@wordpress/private-apis`.
- Preserve distinct sentinel meanings explicitly; do not collapse omission,
  `undefined`, `null`, `false`, and empty values through truthiness.
- When a documented public API or durable stored contract cannot be preserved
  directly, provide a supported alternative, deprecation metadata, migration
  path, correctly classified changelog entry, and a Dev Note when third-party
  developers are affected. Private APIs do not promise external compatibility;
  before removing one, inventory and update in-repository consumers,
  private-API documentation, and the package changelog.
- Keep runtime exports, JSDoc/TypeScript declarations, generated API docs,
  READMEs, examples, changelogs, and migration guidance synchronized.

## Package architecture

- Preserve editor layering: `block-editor` stays standalone and independent of
  higher WordPress screen layers; post-aware screen-neutral behavior belongs in
  `editor`; screen-specific behavior belongs in `edit-post` or `edit-site`.
- Keep declarations faithful to runtime values. Prefer precise object,
  function, promise, generic, key, and optional-value types; do not broaden
  types merely to silence strict checks.
- For public package builds, verify `files`, `main`, `module`, `exports`, types,
  styles, side effects, dependencies, and WordPress script/script-module
  exposure against the artifacts actually published.
- Keep supported Node, npm, browser, PHP, and WordPress targets aligned between
  metadata and CI.
- Keep compatibility branches and suppressions narrow, documented, and
  removable; do not let an exception mask unrelated violations.

## Blocks and durable content

- Use schema-valid `block.json` as canonical metadata and register server-side
  when REST exposure or metadata-managed assets require it.
- Treat static saved markup as durable. If a change invalidates old content,
  provide a self-contained deprecated version and fixtures covering parsing,
  migration, inner blocks, attributes, and serialization—or introduce a new
  block when migration is not credible.
- Keep static `save` pure and dependent on attributes. Persist required values
  or use dynamic server rendering when output depends on external state.
- Treat edit rendering, static serialization, and dynamic PHP rendering as
  separate contracts and verify each affected path.
- Use Block Supports and the appropriate wrapper API:
  `useBlockProps`, `useBlockProps.save`, or
  `get_block_wrapper_attributes()`.
- Define each transform direction explicitly, return valid block objects,
  withhold inapplicable transforms with `isMatch`, and preserve inner blocks
  where the target supports them.
- Express static nesting with `parent`, `ancestor`, and `allowedBlocks`;
  provide per-instance restrictions through `useInnerBlocksProps`; honor
  locking and capability selectors before offering structural operations.
- Preserve original source markup when an invalid block is serialized. Keep
  recovery or conversion explicit rather than silently rewriting content.
- When block or `theme.json` metadata shapes change, update and validate the
  applicable JSON schema.
