# Component Reference

This package includes a library of generic WordPress components to be used for creating common UI elements shared between screens and features of the WordPress dashboard.

## Installation

Install the module

```bash
npm install @wordpress/components --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Usage

Within Gutenberg, these components can be accessed by importing from the `components` root directory:

```jsx
/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

export default function MyButton() {
	return <Button>Click Me!</Button>;
}
```

Many components include CSS to add style, you will need to add in order to appear correctly. Within WordPress, add the `wp-components` stylesheet as a dependency of your plugin's stylesheet. See [wp_enqueue_style documentation](https://developer.wordpress.org/reference/functions/wp_enqueue_style/#parameters) for how to specify dependencies.

In non-WordPress projects, link to the `build-style/style.css` file directly, it is located at `node_modules/@wordpress/components/build-style/style.css`.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>

## Docs & examples

You can browse the components docs and examples at https://wordpress.github.io/gutenberg/

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

This package also has its own [contributing information](/packages/components/CONTRIBUTING.md) where you can find additional details.

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
