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

### Assess bundled and externalized compatibility

For a change to `@wordpress/ui`'s own public API, verify representative existing
consumer source against the candidate package. Compile its types, build it, and
exercise the affected behaviour. Migrating Gutenberg call sites proves the new
contract, but it does not prove whether previously valid consumer code still
works or has adequate migration guidance.

`@wordpress/ui` is published as a package that applications bundle, while some
of its `@wordpress/*` dependencies can be provided by WordPress at runtime.
This allows the UI bundle and the externalized dependency to update on separate
schedules. A current Gutenberg checkout tests only one of the resulting version
combinations.

When a change crosses that boundary, name and assess the exact pairings instead
of relying on the terms "backward" and "forward" alone:

| Bundled `@wordpress/ui` | Externalized dependency | Required result                                                                                                               |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Old                     | Old                     | Preserve the existing baseline.                                                                                               |
| Old                     | New                     | The updated dependency preserves the exports and behaviour used by the published UI bundle.                                   |
| New                     | Old                     | The new UI bundle works with each supported WordPress runtime, or the minimum supported WordPress version changes explicitly. |
| New                     | New                     | The intended new contract and behaviour work together.                                                                        |

Use the last published version before the change as the old package baseline.
Include an earlier version when the declared support window requires it. Build
the new side from the candidate change rather than treating unbuilt source as a
published artifact. Resolve old externalized dependencies from the WordPress
versions the consumer supports, and verify the runtime that WordPress actually
ships rather than relying only on locally installed types.

For every supported pairing, collect evidence at each applicable layer:

1. Install the exact dependency versions together in an isolated consumer.
2. Compile against their published TypeScript declarations.
3. Build with the dependency bundled and with WordPress dependency extraction,
   when both deployments are supported.
4. Verify the export shape in the corresponding WordPress runtime.
5. Exercise the affected component behaviour, including its fallback or
   compatibility route.

Record each layer as `pass`, `fail`, or `unverified`. A unit mock can verify that
capability detection selects the correct branch, but it does not reproduce a
duplicate private-API package, dependency extraction, or an older WordPress
runtime. Use a representative built consumer and real runtime evidence when
those conditions are material.

The `ThemeProvider` promotion is the relevant precedent:

-   [#78958](https://github.com/WordPress/gutenberg/pull/78958) made the API public
    and removed its private route in the same release.
-   [#79594](https://github.com/WordPress/gutenberg/pull/79594) restored the private
    route after published bundled consumers broke.
-   [#79620](https://github.com/WordPress/gutenberg/pull/79620) completed the safer
    transition: the public export became authoritative, the private route remained
    temporarily available, and `@wordpress/ui` detected which runtime shape was
    present.

The private API did not become a supported consumer contract; it was a
time-bounded bridge between independently deployed packages.

If either cross-version pairing fails, keep or add the smallest centralized
compatibility route. Remove it only after the replacement has shipped through
the relevant npm and WordPress release channels and every supported pairing is
verified. If a required pairing cannot be tested, report that gap instead of
assuming compatibility.

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
