# Deprecated

Deprecation utility for WordPress. Logs a message to notify developers about a deprecated feature.

## Installation

Install the module

```bash
npm install @wordpress/deprecated --save
```

## Usage

```js
import deprecated from '@wordpress/deprecated';

deprecated( 'Eating meat', {
	version: 'the future',
	alternative: 'vegetables',
	plugin: 'the earth',
	hint: 'You may find it beneficial to transition gradually.',
} );

// Logs: 'Eating meat is deprecated and will be removed from the earth in the future. Please use vegetables instead. Note: You may find it beneficial to transition gradually.'
```

## Hook

The `deprecated` action is fired with three parameters: the name of the deprecated feature, the options object passed to deprecated, and the message sent to the console.

_Example:_

```js
import { addAction } from '@wordpress/hooks';

function addDeprecationAlert( message, { version } ) {
	alert( `Deprecation: ${ message }. Version: ${ version }` );	
}

addAction( 'deprecated', 'my-plugin/add-deprecation-alert', addDeprecationAlert );
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
