# Admin UI

`@wordpress/admin-ui` should encode WordPress admin page structure, not become another general component library.

## Current role

The package provides components for consistent admin page layouts and helpers for matching the active WordPress admin color scheme.

## Direction from the corpus

The strongest proposal reframes admin-ui as a focused page framework. In that model:

- `Page` owns landmarks, heading hierarchy, header content, actions, padding, and full-bleed escapes.
- Header structure is data-first where the spec needs strict ordering or cardinality.
- Routing is consumer-owned through breadcrumb data and optional link adapters.
- Generic primitives such as Breadcrumbs should move to `@wordpress/ui`.
- App chrome injection should be a plain prop, not slot/fill infrastructure.

This is not all final API yet. Use it as directional architecture until implementation lands.

## Rules

- Use admin-ui when you want the admin page spec enforced.
- Use `@wordpress/ui` when you want flexible generic primitives.
- Do not add product routing, data loading, or application chrome as hard dependencies of admin-ui.
- Preserve semantic landmarks and heading hierarchy.

## Sources

- [@wordpress/admin-ui README](../../../packages/admin-ui/README.md)
- [Admin UI 2.0 proposal issue #77628](../../_sources/github/threads/issue-77628.md)
- [Page header spec issue #76709](../../_sources/github/threads/issue-76709.md)
- [Breadcrumb component proposal issue #77039](../../_sources/github/threads/issue-77039.md)
