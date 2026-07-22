---
name: design-system-consumer-code-review
description: Review an application or plugin change that consumes public WordPress Design System APIs without changing the design-system packages.
---

# Review WordPress Design System consumption

Use this skill for an application, plugin, or Gutenberg feature diff that
consumes `@wordpress/components`, `@wordpress/ui`, or `@wordpress/theme`. It
complements, rather than replaces, a general code review.

## Establish the contract

Inspect the actual diff, affected call sites, runtime documents, and target
package versions. Use an available WordPress Design System MCP server for
discovery, then verify imports, types, setup, and token usage against the
target's local public documentation and exports.

Use [Working with WordPress Design System packages](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/design/design-system-packages.md)
to select the relevant package documentation. Do not judge a consumer against
package-private source conventions.

## Review the user-facing result

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

## Report and hand off

Give findings with the affected public contract, concrete user impact, and
target-version evidence. Escalate a missing component, token, or public API to
`design-system-contribution`; do not prescribe internal package changes in a
consumer-only review.
