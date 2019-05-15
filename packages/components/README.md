# Component Reference

This packages includes a library of generic WordPress components to be used for creating common UI elements shared between screens and features of the WordPress dashboard.

## Installation

Install the module

```bash
npm install @wordpress/components --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

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

Many components also include styles which will need to be output in order to appear correctly. Within WordPress, you can [add the `wp-components` stylesheet as a dependency of your plugin's stylesheet](https://developer.wordpress.org/reference/functions/wp_enqueue_style/#parameters). In other projects, you can link to the `build-style/style.css` file directly.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
