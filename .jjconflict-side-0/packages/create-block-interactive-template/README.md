# Create Block Interactive Template

This is a template for [`@wordpress/create-block`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/create-block/README.md) to create interactive blocks.

## Usage

This block template can be used by running the following command:

```bash
npx @wordpress/create-block --template @wordpress/create-block-interactive-template
```

It requires at least WordPress 6.5 or Gutenberg 17.7.

## Variants

This template exposes three variants. Use the `--variant` flag to select one:

### `default`

The standard interactive block scaffold. Uses the Interactivity API to demonstrate reactive state, context, and DOM event handling.

```bash
npx @wordpress/create-block --template @wordpress/create-block-interactive-template --variant default
```

This is also the variant used when no `--variant` flag is provided.

### `typescript`

Same as `default` but the view script (`view.ts`) is written in TypeScript, with fully typed store state and context.

```bash
npx @wordpress/create-block --template @wordpress/create-block-interactive-template --variant typescript
```

### `client-side-navigation`

Demonstrates client-side navigation powered by `@wordpress/interactivity-router`. The block renders a quote navigator whose Prev / Next links swap page content without a full reload. A client-side stopwatch running outside the router region proves that no full page reload occurred.

```bash
npx @wordpress/create-block --template @wordpress/create-block-interactive-template --variant client-side-navigation
```

This variant adds `@wordpress/interactivity-router` as an additional npm dependency.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
