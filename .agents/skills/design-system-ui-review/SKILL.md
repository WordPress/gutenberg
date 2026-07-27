---
name: design-system-ui-review
description: Use when reviewing a Gutenberg, plugin, or application UI/UX change for correct public WordPress Design System usage and user-facing behaviour, including a component, control, visual styling, token, interaction, layout, overlay, or other user-facing interface; do not use to implement a change or review Design System package source.
---

# Review a WordPress Design System interface

## Authority and scope

- Keep the review read-only. Do not modify source, commit, push, post review
  comments, or update pull-request metadata.
- Review any application, plugin, or Gutenberg UI/UX diff. Route a change to
  `packages/components`, `packages/ui`, or `packages/theme` to
  `design-system-code-review`.
- Assess whether documented public components, tokens, theming, or composition
  fit the user need. Do not judge a consumer against package-private source
  conventions or require a migration merely because a similar API exists.

## Review method

1. Define the changed user-facing behaviour, affected users, runtime document,
   and target package versions.
2. Inspect the diff, affected call sites, and existing components, tokens, and
   styles. The absence of a Design System import is not evidence that no public
   option fits.
3. Discover relevant public components, tokens, and setup through the target
   documentation and, when available, a WordPress Design System MCP server.
   Verify the result against target public exports, types, and documentation.
4. Determine whether existing public composition meets the concrete need. When
   it does, assess whether the custom implementation creates a user-facing,
   accessibility, consistency, or maintenance cost that justifies a finding.
   When it does not, record the limitation rather than forcing an unsuitable
   primitive.
5. Verify documented public APIs, styles, tokens, overlays, and theming in the
   document that renders the interface. Resolve uncertainty through application
   source and browser behaviour before reporting it.

## Assess the user-facing result

Check, as applicable:

- component or token reuse, composition, and a justified need for custom UI;
- semantic structure, keyboard and focus behaviour, visible states, responsive
  behaviour, and application-level test coverage;
- stylesheet and token availability for each document, iframe, portal, or
  overlay that renders the interface;
- behavioural, styling, accessibility, and compatibility parity for a package
  migration.

## Output contract

Start with a short scope assessment. Give each material finding the affected
user-facing behaviour, target-version evidence, concrete impact, and smallest
coherent direction. Separate verification gaps from findings and report no
findings when the evidence exposes none. Escalate a missing public component,
token, or API by documenting an upstream Design System request. Route it to
`design-system-contribution` only in a local Gutenberg checkout; do not
prescribe internal package changes in a consumer-only review.
