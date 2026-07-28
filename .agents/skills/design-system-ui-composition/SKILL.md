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

Before selecting a component, identify the actual rendering owner and parent
surface, runtime document, providers and styles present in that subtree, and
nearest same-surface precedent. Do not infer the UI boundary from the package
folder alone.

Before writing custom UI, determine whether an existing public component, token,
or composition already meets the need. The absence of an existing Design System
import does not establish that a custom control is necessary.

Follow the current recommendation sources and target-version checks in
[Working with WordPress Design System packages](../../docs/contributors/design/design-system-packages.md#choose-a-recommended-component).
When the target packages are installed rather than checked out, use the
corresponding version of their shipped documentation. Trunk documentation and
MCP results can identify possibilities, but do not establish availability in an
older release.

## Choose and compose

1. Look for an existing public component and compose it before creating an
   application-local control.
2. Use the package and import selected by the current recommendation sources;
   do not infer the choice from package age.
3. Use semantic `--wpds-*` tokens from the generated reference. Do not copy
   token inventories, package-private CSS modules, Base UI details, or source
   paths into application code.
4. Apply the
   [document-specific setup](../../docs/contributors/design/design-system-packages.md#setup-depends-on-the-document).
   For an iframe, popup, or other document, read
   [`@wordpress/theme`'s “Across documents” section](../../packages/theme/README.md#across-documents-iframes-and-other-portals)
   and the linked target-package setup before editing.
5. Preserve existing behaviour during a package migration. Establish visual,
   interaction, accessibility, and compatibility parity before replacing a
   working component.

Stop searching when one recommended public option satisfies the required
behaviour and target setup. Search outside the target surface only when local
evidence is absent, unsuitable, or migration compatibility is in scope.

## Verify

Run the application's relevant checks and manually verify the changed UI:

- semantic structure, keyboard and focus behaviour, visible states, and
  responsive behaviour;
- stylesheet and token availability in every document that renders the UI;
- portals, overlays, and mixed-package behaviour where applicable.

Before declaring completion, recheck each rendering document and exercise the
changed interaction in its real context.

## Escalate a design-system gap

When public components or tokens cannot meet the need, do not use internal
implementation details as a workaround. Record the user need, attempted
composition, proposed public behaviour, target versions, and affected
consumers. In a local Gutenberg checkout, route the request to
`design-system-contribution`; otherwise, use that record to request an
upstream Design System change.
