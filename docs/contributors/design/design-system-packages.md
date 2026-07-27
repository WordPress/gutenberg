# Working with WordPress Design System packages

The WordPress Design System is available through the public
`@wordpress/components`, `@wordpress/ui`, and `@wordpress/theme` packages.
This guide helps contributors choose the right boundary when building with, or
changing, those packages.

## Choose the work boundary

Use the public packages when building a Gutenberg feature, plugin, or
standalone application. An application consumer may use documented components,
props, semantic `--wpds-*` tokens, and public theming/setup APIs. It must not
depend on package-private source paths, CSS modules, Base UI implementation
details, or a Gutenberg checkout.

Use the package contribution workflows only when changing
`packages/components`, `packages/ui`, or `packages/theme`. A package change
must consider its published API and users beyond the Gutenberg call sites.

If the public surface cannot meet a product need, document the behaviour,
affected consumers, attempted composition, and proposed public contract. Do
not bypass that decision with a package-private import.

## Check the target version

1. Identify the target: a Gutenberg checkout/PR head, or the application’s
   installed package versions.
2. Verify the relevant public contract in the target’s package README,
   generated token reference, exports, and types.

Use the package documentation as the source of durable facts:

- [`@wordpress/components` README](/packages/components/README.md)
- [`@wordpress/ui` README](/packages/ui/README.md)
- [`@wordpress/theme` README](/packages/theme/README.md)
- [Design Tokens Reference](/packages/theme/docs/tokens.md)

## Build with public packages

Choose an existing public component and composition before introducing an
application-local custom control. `@wordpress/components` remains part of the
supported design-system surface. Do not migrate to `@wordpress/ui` merely
because it is newer; preserve behavioural, styling, accessibility, and
compatibility parity for an intentional migration.

Use semantic `--wpds-*` custom properties from the generated reference. Token
names and values change over time, so do not copy a token inventory into a
guide, application convention, or skill.

### Setup depends on the document

Standard WordPress editor screens manage shared styles centrally. A separate
application, iframe, popup window, or portal can require its own stylesheet
and theming setup. Follow the target package README for that document rather
than copying setup recipes.

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
- [Design Tokens Maintainer's Guide](/packages/theme/tokens/README.md)

Keep implementation details distinct from public API. For public changes,
decide and document compatibility, migration, release, generated-output, and
consumer implications. Verify CSS and interaction behaviour in a browser where
unit tests cannot establish cascade order, focus geometry, or portal behaviour.

## Review checklist

Consumer reviews verify the public contract and user-facing result: documented
imports, styles and tokens in each document, overlay and iframe setup,
semantics, keyboard/focus behaviour, states, responsive behaviour, and tests.

Package-contribution reviews additionally assess public exports, external
consumers, compatibility, source conventions, generated files, documentation,
stories, and release impact. A source convention is evidence to compare with
the current codebase, not a substitute for demonstrating user impact.
