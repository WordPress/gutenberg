# Working with WordPress Design System packages

The [Design System introduction](/storybook/stories/design-system/introduction.mdx)
lists its foundational and compositional packages. This guide focuses on
`@wordpress/components`, `@wordpress/ui`, and `@wordpress/theme`, the public
packages contributors must compare during the current component transition.
`@wordpress/components` remains supported, even though the introduction
distinguishes it from the newer Design System packages.

## Choose the work boundary

Use the public packages when building a Gutenberg feature, plugin, or
standalone application. An application consumer may use public package
entrypoints, documented props, semantic `--wpds-*` tokens, and public
theming/setup APIs. It must not depend on package-private source paths, CSS
modules, Base UI implementation details, private API bridges, or a Gutenberg
checkout.

Do not treat an API as private only because its name starts with
`__experimental`. Legacy experimental APIs shipped by WordPress can carry
public compatibility obligations. Verify their status against the
[canonical API boundary guidance](/docs/contributors/code/coding-guidelines.md#legacy-experimental-apis-plugin-only-apis-and-private-apis).

Use the package contribution workflows only when changing
`packages/components`, `packages/ui`, or `packages/theme`. A package change
must consider its published API and users beyond the Gutenberg call sites.

If the public surface cannot meet a product need, document the behaviour,
affected consumers, attempted composition, and proposed public contract. Do
not bypass that decision with a package-private import.

## Check the target version

Before choosing or reviewing an API, identify where the application gets it in
production:

1. For a Gutenberg change, use the PR head or current checkout.
2. If the application bundles the package, check the installed package version.
3. If WordPress provides the package at runtime, check the application's minimum
   supported WordPress version. Verify that version provides the required export
   and script or style handle.

Build tools call the third case "externalized": the package is not included in
the application bundle. Inspect the build configuration and generated asset
metadata to confirm which case applies. The default
[`@wordpress/dependency-extraction-webpack-plugin`](/packages/dependency-extraction-webpack-plugin/README.md)
externalizes many WordPress packages.

Use the package documentation as the source of durable facts:

- [Design System introduction](/storybook/stories/design-system/introduction.mdx)
  for current package roles and layering
- [`@wordpress/components` README](/packages/components/README.md)
- [`@wordpress/ui` README](/packages/ui/README.md)
- [`@wordpress/theme` README](/packages/theme/README.md)
- [Design Tokens Reference](/packages/theme/docs/tokens.md)

Use evidence for the state it actually describes:

- The deployed checkout or runtime is authoritative for available exports,
  styles, and runtime behaviour. An installed package proves compile-time
  types, not an externalized runtime API.
- In a review, the supplied diff describes the proposed post-change state;
  use the checkout as its baseline and supporting context. Do not reject a
  change merely because the diff has not been applied to that checkout.
- The Design System MCP server and current Storybook describe current
  recommendations. They do not prove that an older target exports an API.

## Build with public packages

Choose an existing public component and composition before introducing an
application-local custom control.

### Choose a recommended component

`@wordpress/components` remains supported. The transition to `@wordpress/ui`
happens component by component, so select the recommended package for each
component. Do not treat either package's age as a universal selection rule or
migrate mechanically from one package to the other.

For the current package versions, use the maintained recommendation sources
instead of copying component mappings into documentation or agent instructions:

1. When available, query the
   [WordPress Design System MCP server](/packages/design-system-mcp/README.md)
   with `get_components`, then use `get_component_details` for the relevant
   component. Its component catalog is generated from the curated Storybook
   manifest and returns the currently recommended package and import.
2. Otherwise, inspect the maintained `ALLOWLIST` and `DENYLIST` in the
   [`use-recommended-components` ESLint rule source](/packages/eslint-plugin/rules/use-recommended-components.js).
   Its [documentation](/packages/eslint-plugin/docs/rules/use-recommended-components.md)
   explains rule behaviour and links migration guides.
3. When the rule does not cover a component, inspect that component's
   `*.story.*` source file in the target checkout. Use its `componentStatus` and
   notes. The [rendered Storybook](https://wordpress.github.io/gutenberg/) is a
   human-readable companion, but the source file is available to agents and can
   be checked against the target version. That status is more authoritative
   than an `experimental` tag or component prefix.

For an application on older package versions, use the corresponding version of
those sources and verify the choice against its installed exports, types, and
documentation. Preserve behavioural, styling, accessibility, and compatibility
parity when migrating an existing component.

Use semantic `--wpds-*` custom properties for Design System interface styling.
Use `--wp--preset--*` custom properties for `theme.json` presets and
block-facing styles. Token names and values change over time, so do not copy a
token inventory into a guide, application convention, or skill.

### Setup depends on the document

Standard WordPress editor screens manage shared styles centrally. A separate
application, iframe, popup window, or portal can require its own stylesheet
and theming setup. Inventory which public packages render in each document,
then follow the applicable package setup guidance:

- [`@wordpress/components`](/packages/components/README.md)
- [`@wordpress/ui`](/packages/ui/README.md#setup)
- [`@wordpress/theme`](/packages/theme/README.md#across-documents-iframes-and-other-portals)

Apply setup only for packages that render there rather than copying a combined
recipe into every document.

When an application directly bundles `@wordpress/components` and
`@wordpress/ui`, follow the `@wordpress/ui` README’s documented overlay
compatibility setup. Test overlays and focus in their actual rendering
documents.

## Change a package safely

Start with a consumer and precedent audit: who needs the behaviour, which
existing component or token is closest, and why public composition is not
enough. Then follow the source guidance for the package being changed:

- [`@wordpress/components` contribution guide](/packages/components/CONTRIBUTING.md)
- [`@wordpress/ui` contribution guide](/packages/ui/CONTRIBUTING.md)
- [`@wordpress/theme` package guide](/packages/theme/README.md)
- [Design Tokens Maintainer's Guide](/packages/theme/tokens/README.md)

Keep implementation details distinct from public API. For public changes,
decide and document compatibility, migration, release, generated-output, and
consumer implications. Verify CSS and interaction behaviour in a browser where
unit tests cannot establish cascade order, focus geometry, or portal behaviour.

Before declaring package work complete, follow the applicable package source
guidance and account for each relevant contract surface: public
exports and types; semantics, states, interaction, and refs; compatibility and
migration; focused tests and stories; public documentation and recommendation
metadata; generated output; and the required changelog. Mark a surface not
applicable rather than silently skipping it.

## Review checklist

Consumer reviews verify the public contract and user-facing result: documented
imports, styles and tokens in each document, overlay and iframe setup,
semantics, keyboard/focus behaviour, states, responsive behaviour, and tests.

Package-contribution reviews additionally assess public exports, external
consumers, compatibility, source conventions, generated files, documentation,
stories, and release impact. A source convention is evidence to compare with
the current codebase, not a substitute for demonstrating user impact.
