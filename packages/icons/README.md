# Icons

WordPress Icons Library.

## Installation

Install the module:

```bash
npm install @wordpress/icons --save
```

*This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code.*

## Usage

```js
import { Icon, check } from '@wordpress/icons';

<Icon icon={ check } />;
```

## Props

| Name   | Type      | Default | Description             |
| ------ | --------- | ------- | ----------------------- |
| `size` | `integer` | `24`    | Size of icon in pixels. |

## Docs & Examples

You can browse the icons docs and examples at <https://wordpress.github.io/gutenberg/?path=/docs/icons-icon--default>

## Adding new icons

1. **Add the SVG file**: Place your SVG file in the `src/library/` directory. The filename should be in kebab-case (e.g., `my-new-icon.svg`).
2. **TypeScript files are auto-generated**: The TypeScript component files (`.tsx`) are generated from the SVG files by the build script, so you do not need to create or edit them manually. They are generated automatically when you commit changes under `src/library/`.

### Publishing as a WordPress core icon

To ship an icon to WordPress core and register it in the icon registry, add it to `manifest.json`:

> [!IMPORTANT]
> Once an icon has shipped in a WordPress core release, never remove it or change its `slug`. Existing content, integrations, and imports reference icons by their slug, so doing so is a breaking change.

1. **Add the icon to `manifest.json`**: Add an entry for your icon in `src/manifest.json`. The entry should include:
   - `slug`: The icon identifier (should match the SVG filename without the `.svg` extension)
   - `label`: The human-readable label for the icon. Use Title Case (for example, `My New Icon`).
   - `filePath`: The relative path to the SVG file (e.g., `library/my-new-icon.svg`)
   - `showInRest` (optional): Set to `true` to list the icon in the SVG Icons REST API and offer it in the Icon block. Defaults to `false` when omitted, registering the icon without exposing it through the REST API.
2. **Do not edit `manifest.php`**: The `manifest.php` file is automatically generated from `manifest.json` by the build script. Do not edit it manually, as your changes will be overwritten when the build runs.

Run `npm run build` again to regenerate `manifest.php`. Icons.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).
