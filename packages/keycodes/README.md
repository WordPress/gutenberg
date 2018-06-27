# @wordpress/keycodes

Keycodes utilities for WordPress, used to check the key pressed in events like `onKeyDown`. Contains keycodes constants for keyboard keys like `DOWN`, `UP`, `ENTER`, etc.

Example usage:

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

## Installation

Install the module

```bash
npm install @wordpress/keycodes --save
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
