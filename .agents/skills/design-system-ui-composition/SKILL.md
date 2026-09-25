---
name: design-system-ui-composition
description: Use when building or changing a Gutenberg feature, plugin interface, or standalone application UI with public `@wordpress/components`, `@wordpress/ui`, or `@wordpress/theme` APIs, including when the code does not yet use the Design System; do not use to change package source or depend on package-private implementation details.
---

# Compose a WordPress Design System interface

## Classify before searching

1. State the user-visible behaviour, minimum runtime and package versions,
   rendering owner, runtime document, and whether each Design System dependency
   is bundled or externalized.
2. Inspect the changed surface and its nearest same-surface precedent once.
3. Choose the narrowest path:
   - **Lightweight:** keep an existing supported component when behaviour,
     styling, and document setup do not change.
   - **Standard:** select or compose a public component or token.
   - **Deep:** handle custom UI, a package migration, or another rendering
     document such as an iframe, popup, or portal.

Do not reopen component selection on the lightweight path. Verify the existing
contract, make the narrow change, and stop.

## Select for the behaviour

When selection is material, write the required interaction contract before
choosing a component. Follow the maintained recommendation sources and
target-version checks in
[Working with WordPress Design System packages](../../../docs/contributors/design/design-system-packages.md#choose-a-recommended-component),
then verify the selected public API in the deployed runtime or installed
version, as applicable.

Choose the smallest public composition that owns exactly the required
behaviour. Do not turn a trigger into a menu, dialog, or state owner merely
because a nearby precedent does. Stop searching when one recommended option
satisfies the behaviour and setup.

## Apply conditional setup

- For custom UI, first establish why public composition is insufficient.
- For a migration, preserve observable interaction, styling, accessibility,
  and compatibility.
- For a separate document, read the
  [cross-package document setup guidance](../../../docs/contributors/design/design-system-packages.md#setup-depends-on-the-document)
  before editing. Make a short per-document ledger for the packages actually
  used: static styles, runtime-injected styles, root theming, and overlays.
  Mark each applicable requirement verified or blocked; do not add setup for a
  package that does not render there.

For a planning task with no concrete host file or state owner, keep the plan
actionable under explicit assumptions. When the request names a target, inspect
that exact target; do not silently plan against another package or active
equivalent. Treat missing context as a verification gap; block only when it
prevents a safe behaviour or API decision.

Use the linked public documentation for API and setup facts. Do not copy its
component mappings, token inventory, or implementation recipes into this
skill.

## Finish

Exercise the changed interaction and run focused checks. Before declaring
completion, recheck the behaviour contract and every rendering document.
Report unresolved setup or parity evidence as blocked rather than silently
omitting it.

If no public API meets the need, document the unmet behaviour and affected
consumers. Route package work to `design-system-contribution` in a local
Gutenberg checkout; otherwise request an upstream Design System change.
