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

## Contributing

See [CONTRIBUTING.md](/packages/components/CONTRIBUTING.md) for the contributing guidelines for the `@wordpress/components` package.
