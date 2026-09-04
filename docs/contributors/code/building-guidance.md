# Gutenberg Building Guidance

Use this guidance when implementing, self-reviewing, or reviewing a Gutenberg change.

## Establish scope

1. Identify the stated behavior and affected contracts: runtime, public API, serialized content, accessibility, package output, REST schema, generated files, documentation, or release state.
2. Inspect surrounding implementation, tests, package metadata, and governing contributor documentation before declaring a convention.
3. Search for existing helpers, analogous implementations, public consumers, fixtures, and surrounding tests before adding a new pattern or claiming a break.
4. Treat repository `AGENTS.md` instructions as authoritative for agent work. Current code and repository instructions always win over historical review patterns.

## Focused guidance

-   Cross-cutting lifecycle, boundary, and verification checks: [Cross-cutting method](/docs/contributors/code/cross-cutting-method.md)
-   UI components, interaction, keyboard, focus, styles, responsive behavior, localization: [UI, interaction, accessibility, styles, and localization](/docs/contributors/code/ui-accessibility.md)
-   React hooks, `@wordpress/data`, async work, entities, preferences, performance: [React, data, runtime lifecycle, and performance](/docs/contributors/code/react-data-lifecycle.md)
-   Package layering, exports, public APIs, blocks, saved markup, compatibility: [Packages, APIs, blocks, and compatibility](/docs/contributors/code/packages-apis-compatibility.md)
-   PHP, REST routes and schemas, permissions, sanitization, escaping: [PHP, REST, schema, and security](/docs/contributors/code/php-rest-schema.md)
-   Workspaces, dependencies, builds, CI, generated artifacts, releases: [Tooling, dependencies, CI, generated artifacts, and releases](/docs/contributors/code/tooling-ci-release.md)
-   Tests, changelogs, documentation, fixtures, snapshots, delivery evidence: [Tests, documentation, changelogs, and delivery evidence](/docs/contributors/code/testing-docs-delivery.md)
-   Use the [cross-cutting method](/docs/contributors/code/cross-cutting-method.md) when a change crosses more than one Gutenberg boundary.
