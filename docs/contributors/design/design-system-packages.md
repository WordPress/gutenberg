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

Use the package contribution workflows when changing `packages/components`, `packages/ui`, or `packages/theme`. A package change must consider its published API and users beyond the Gutenberg call sites. When a change includes both package code and application code, check both contracts. Keep product-specific behavior in the consuming package; add shared behavior to the Design System only when it belongs in a reusable component or token.

If the public surface cannot meet a product need, document the behavior,
affected consumers, attempted composition, and proposed public contract. Do
not bypass that decision with a package-private import.

## Check the target version

For a Gutenberg change, use the proposed source and its dependencies. Check other versions when the consuming application runs a different package or WordPress release:

1. If the application bundles the package, check the installed package version.
2. If WordPress provides the package at runtime, check the application's minimum supported WordPress version. Verify that version provides the required export and script or style handle.

Build tools call the second case "externalized": the package is not included in the application bundle. When the source of the runtime dependency is unclear, inspect the build configuration and generated asset metadata. The default [`@wordpress/dependency-extraction-webpack-plugin`](/packages/dependency-extraction-webpack-plugin/README.md) externalizes many WordPress packages.

Use the package documentation as the source of durable facts:

- [Design System introduction](/storybook/stories/design-system/introduction.mdx)
  for current package roles and layering
- [`@wordpress/components` README](/packages/components/README.md)
- [`@wordpress/ui` README](/packages/ui/README.md)
- [`@wordpress/theme` README](/packages/theme/README.md)
- [Design Tokens Reference](/packages/theme/docs/tokens.md)

Use evidence for the state it actually describes:

- The deployed checkout or runtime is authoritative for available exports,
  styles, and runtime behavior. An installed package proves compile-time
  types, not an externalized runtime API.
- In a review, establish whether the checkout is the base, proposed head, or another revision. Read the diff with the corresponding source. An unapplied diff is not evidence that its new API is missing, and a head checkout is not evidence of the old behavior.
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
   explains rule behavior and links migration guides.
3. When the rule does not cover a component, inspect that component's
   `*.story.*` source file in the target checkout. Use its `componentStatus` and
   notes. The [rendered Storybook](https://wordpress.github.io/gutenberg/) is a
   human-readable companion, but the source file is available to agents and can
   be checked against the target version. That status is more authoritative
   than an `experimental` tag or component prefix.

For an application on older package versions, use the corresponding version of
those sources and verify the choice against its installed exports, types, and
documentation. Preserve behavioral, styling, accessibility, and compatibility
parity when migrating an existing component.

For forms that edit a dataset, consider [`DataForm`](/packages/dataviews/README.md#dataform). For inline validation, read the [Validated Form Controls overview](/packages/ui/src/form/with-validation/stories/overview.mdx), including its status and limitations, and verify the target-version exports. Choose based on the form's state and validation needs rather than replacing individual controls without checking the whole form.

Use semantic `--wpds-*` custom properties for Design System interface styling.
Use `--wp--preset--*` custom properties for `theme.json` presets and
block-facing styles. Token names and values change over time, so do not copy a
token inventory into a guide, application convention, or skill.

Prefer component props when they already express the styling intent. For custom styles, use the Design System MCP server's `get_design_tokens` when available. Without MCP, use the [Design Tokens Reference](/packages/theme/docs/tokens.md#how-to-pick-a-token). Choose a token by semantic purpose and state, not by matching its current raw value. Not every CSS literal needs a token. Use the active theme's `theme.json` presets when styling blocks or content previews, including previews inside the editor.

### Setup depends on the document

Standard WordPress editor screens manage shared styles centrally. A separate application, iframe, or popup window can require its own stylesheet and theming setup. Inventory which public packages render in each document, then follow the applicable package setup guidance:

- [`@wordpress/components`](/packages/components/README.md)
- [`@wordpress/ui`](/packages/ui/README.md#setup)
- [`@wordpress/theme`](/packages/theme/README.md#across-documents-iframes-and-other-portals)

Apply setup only for packages that render there rather than copying a combined
recipe into every document.

A [React portal](https://react.dev/reference/react-dom/createPortal) changes DOM placement and can remain in the same document. Inspect its actual container and `ownerDocument` before adding document setup. CSS selectors and inherited custom properties follow the DOM tree, so a class on a toolbar or a nested theme provider may not reach a popup portaled outside that subtree. Apply product-specific popup styling through documented props or a class on the popup itself. Verify that its stylesheet is present in the destination document.

Follow the [`ThemeProvider` nesting and root guidance](/packages/theme/README.md#nesting-providers) when overlays need theme overrides. Do not add an `isRoot` provider for every overlay; it changes document-level tokens, and only one root provider is supported per document.

When an application directly bundles `@wordpress/components` and
`@wordpress/ui`, follow the `@wordpress/ui` README’s documented overlay
compatibility setup. Test overlays and focus in their actual rendering
documents.

## Change a package safely

Identify the affected consumers and a relevant component or token precedent. For a new capability, establish why existing public composition is insufficient. For a bug fix or internal refactor, identify the contract to restore or preserve. Follow the source guidance for the package being changed:

- [`@wordpress/components` contribution guide](/packages/components/CONTRIBUTING.md)
- [`@wordpress/ui` contribution guide](/packages/ui/CONTRIBUTING.md)
- [`@wordpress/theme` package guide](/packages/theme/README.md)
- [Design Tokens Maintainer's Guide](/packages/theme/tokens/README.md)

Keep implementation details distinct from public API. For public changes,
decide and document compatibility, migration, release, generated-output, and
consumer implications. Verify CSS and interaction behavior in a browser where
unit tests cannot establish cascade order, focus geometry, or portal behavior.

When changing a contract between a bundled Design System package and a dependency supplied separately by WordPress, follow [Testing published packages across WordPress versions](/docs/contributors/code/package-runtime-compatibility.md). Check the supported entrypoints and version pairings affected by that contract. An unrelated internal edit does not need this matrix.

Before declaring package work complete, check the requirements affected by the change:

- Public exports and types, including declarations that resolve through the package's declared dependencies.
- Semantics, states, interaction, refs, compatibility, and migration.
- Focused tests and stories, public documentation, and component recommendation metadata when status or exports change.
- Generated output and the changelog required by the [package policy](/packages/README.md#maintaining-changelogs).

An internal refactor does not automatically need new stories or public documentation. Explain unresolved requirements without adding a checklist of unrelated surfaces to every contribution.

### Compare contracts before replacing an API

Compare the affected old and new behavior before removing, renaming, or replacing a component, prop, token, or extension point. Include accepted values and defaults, controlled and uncontrolled state, callback arguments, rendered semantics, ref targets, styling hooks, and keyboard or focus behavior where they apply. A compact comparison table can help with a multi-part migration.

Search consumers beyond the changed package. Migrating all repository call sites does not prove compatibility for plugins or other npm consumers. Check documented extension points, such as SlotFill children and render callbacks, against the values and compositions they previously accepted. An adapter that handles built-in callers may not handle third-party input. If external usage cannot be established, state that limit and make any retirement of supported behavior explicit.

Before removing or changing a public API, use [Veloria](https://veloria.dev/) to look for usage in WordPress.org plugins and themes. Search relevant identifiers, hooks, styling hooks, and common access patterns, then inspect matches in context. Record the search scope and relevant results. Matches can demonstrate compatibility impact; no matches do not prove that removal is safe. Private code, commercial products distributed elsewhere, and usages obscured by compilation or dynamic access may remain undiscovered. Use this evidence alongside the API's support policy and migration options.

For tokens, compare semantic purpose and affected modes as well as default values. Follow the [token source guide](/packages/theme/tokens/README.md) and [build procedure](/packages/theme/README.md#building), then inspect the generated assets and consumers affected by the change. Two tokens with equal values in one theme are not necessarily interchangeable.

## Verify the affected behavior

Select verification from the changed contract and the [testing overview](/docs/contributors/code/testing-overview.md#folder-structure). Use existing coverage where it proves the behavior. Keep state and structural checks in jsdom; use Browser Mode or a reproducible browser check for computed styles, layout, native focus, scrolling, and transitions. Load the styles used by the real consumer. Class assertions, mocked geometry, and snapshots alone do not prove visual parity.

Do not add or request tests just because coverage is absent. Rely on a third-party dependency's tests for behavior it owns and that the change leaves intact. Focus local coverage on our transformations, overrides, state handling, and integration where they introduce a concrete regression risk. Identify the supported use case, likely failure, and consequence before adding a test, then choose the smallest check not already covered. Avoid duplicating dependency suites, enumerating every prop combination, or building fixtures for speculative edge cases. Weigh realistic likelihood and impact together; an uncommon supported use case can still matter when failure has a serious consequence.

For interaction changes, check the keyboard and pointer paths, accessible names, state transitions, dismissal, or focus return that our changes can affect. Use existing coverage of unchanged behavior. Compare accessibility requirements with the applicable [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/), [ARIA specification](https://www.w3.org/TR/wai-aria-1.2/), or [WCAG](https://www.w3.org/TR/WCAG22/). A passing automated check is evidence for the rules it checks, not proof of complete accessibility.

For style or token changes, select conditions based on the declarations or token modes being changed. Relevant cases can include light and dark themes, nested providers, density, RTL, forced colors, reduced motion, long or translated content, zoom, or constrained containers; this is not a required test matrix. Inspect composed consumers where their overrides or layout can change the result. Check whether a responsive decision depends on the viewport or the component's container before choosing a breakpoint or measurement API.

Run the repository's applicable lint, type, generation, and build checks. Distinguish verified results from manual steps that have not been run. A blocked browser check limits a parity claim; it does not by itself prove a defect.
