---
name: design-system-ui-composition
description: Use when building or changing a Gutenberg feature, plugin interface, or standalone application UI with public `@wordpress/components`, `@wordpress/ui`, or `@wordpress/theme` APIs, including when the code does not yet use the Design System; do not use to change package source or depend on package-private implementation details.
---

# Compose a WordPress Design System interface

## Authority and scope

- Use this skill for application UI/UX work, including code that does not yet
  consume `@wordpress/components`, `@wordpress/ui`, or `@wordpress/theme`.
- Prefer public Design System composition when it meets the concrete user need;
  retain custom UI when the public surface is unsuitable and state why.
- Keep the target checkout or installed package version as the compatibility
  boundary. Do not infer package-change, commit, push, or pull-request
  authority.
- In a local Gutenberg checkout, route a missing public component, token, or
  API to `design-system-contribution`. Otherwise, document the gap for an
  upstream Design System request rather than importing package internals.

## Start with the target

Identify the target checkout or installed package versions, the runtime
(standard WordPress screen, separate application, iframe, or portal), and the
user-facing behaviour. Treat that local target as the compatibility boundary.

Before writing custom UI, determine whether an existing public component, token,
or composition already meets the need. The absence of an existing Design System
import does not establish that a custom control is necessary.

If a WordPress Design System MCP server is available, use it to discover the
current vocabulary and components. Then verify the recommendation against the
target's public contract. The MCP result does not make an API available in an
older checkout or package release.

Read the target package documentation before coding. In a local Gutenberg
checkout, use:

- [`@wordpress/components`](../../packages/components/README.md)
- [`@wordpress/ui`](../../packages/ui/README.md)
- [`@wordpress/theme`](../../packages/theme/README.md)
- [Design Tokens Reference](../../packages/theme/docs/tokens.md)
- [Working with WordPress Design System packages](../../docs/contributors/design/design-system-packages.md)

When the target package is installed rather than checked out, read the
corresponding documentation shipped with that package. When target
documentation is unavailable, use these portable fallback links only to
discover possibilities, not to establish target-version availability:

- [`@wordpress/components`](https://github.com/WordPress/gutenberg/blob/trunk/packages/components/README.md)
- [`@wordpress/ui`](https://github.com/WordPress/gutenberg/blob/trunk/packages/ui/README.md)
- [`@wordpress/theme`](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/README.md)
- [Design Tokens Reference](https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/docs/tokens.md)
- [Working with WordPress Design System packages](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/design/design-system-packages.md)

## Choose and compose

1. Look for an existing public component and compose it before creating an
   application-local control.
2. Use the package whose documented public API and setup match the target.
   `@wordpress/components` remains supported; do not mechanically replace it
   with `@wordpress/ui`.
3. Use semantic `--wpds-*` tokens from the generated reference. Do not copy
   token inventories, package-private CSS modules, Base UI details, or source
   paths into application code.
4. Apply the documented setup for the target document. In particular, check
   stylesheets and theme delivery for a separate document, iframe, or portal.
   When directly bundling both UI packages, use their documented overlay
   compatibility path.
5. Preserve existing behaviour during a package migration. Establish visual,
   interaction, accessibility, and compatibility parity before replacing a
   working component.

## Verify

Run the application's relevant checks and manually verify the changed UI:

- semantic structure, keyboard and focus behaviour, visible states, and
  responsive behaviour;
- stylesheet and token availability in every document that renders the UI;
- portals, overlays, and mixed-package behaviour where applicable.

## Escalate a design-system gap

When public components or tokens cannot meet the need, do not use internal
implementation details as a workaround. Record the user need, attempted
composition, proposed public behaviour, target versions, and affected
consumers. In a local Gutenberg checkout, route the request to
`design-system-contribution`; otherwise, use that record to request an
upstream Design System change.
