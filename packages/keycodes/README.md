# Keycodes

Keycodes utilities for WordPress, used to check the key pressed in events like `onKeyDown`. Contains keycodes constants for keyboard keys like `DOWN`, `UP`, `ENTER`, etc.

## Installation

Install the module

```bash
npm install @wordpress/keycodes --save
```

_This package assumes that your code will run in an ES5 environment. If you're using an environment that has limited or no support for ES5 such as lower versions of IE then using [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Usage

Check which key was used in an `onKeyDown` event:

```js
import { DOWN, ENTER } from '@wordpress/keycodes';

// [...]

onKeyDown( event ) {
	const { keyCode } = event;
	
	if ( keyCode === DOWN ) {
		alert( 'You pressed the down arrow!' );
	} else if ( keyCode === ENTER ) {
		alert( 'You pressed the enter key!' );
	} else {
		alert( 'You pressed another key.' );
	}
}
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
