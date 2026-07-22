---
name: design-system-consumer-code-review
description: Perform a read-only review of an application, plugin, or Gutenberg feature that consumes public WordPress Design System APIs without changing the packages. Use for consumer-only review requests involving `@wordpress/components`, `@wordpress/ui`, or `@wordpress/theme`; do not use to implement a change or review package source.
---

# Review WordPress Design System consumption

## Authority and scope

- Keep the review read-only. Do not modify source, commit, push, post review
  comments, or update pull-request metadata.
- Review an application, plugin, or Gutenberg feature diff that consumes
  `@wordpress/components`, `@wordpress/ui`, or `@wordpress/theme`.
- Assess documented public contracts and user-facing behaviour. Do not judge a
  consumer against package-private source conventions.

## Review method

1. Inspect the diff, affected call sites, runtime documents, and target package
   versions.
2. Use an available WordPress Design System MCP server for discovery, then
   verify imports, types, setup, and token usage against target public
   documentation and exports.
3. Use [Working with WordPress Design System packages](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/design/design-system-packages.md)
   to select the relevant package documentation.
4. Resolve uncertainty through the application, documented setup, and browser
   behaviour before reporting it.

## Assess the user-facing result

Check that the change:

- imports documented public APIs and uses semantic public tokens;
- loads the required styles and tokens in the document that renders the UI;
- handles portals, iframes, and mixed `@wordpress/components` / `@wordpress/ui`
  overlays using documented setup;
- preserves semantic structure, keyboard and focus behaviour, visible states,
  responsive behaviour, and application-level test coverage;
- justifies a migration and demonstrates behavioural, styling, accessibility,
  and compatibility parity instead of assuming that a newer package is a drop-in
  replacement.

## Output contract

Start with a short scope assessment. Give each material finding the affected
public contract, concrete user impact, and target-version evidence. Separate
verification gaps from findings and report no findings when the evidence
exposes none. Escalate a missing component, token, or public API to
`design-system-contribution`; do not prescribe internal package changes in a
consumer-only review.
