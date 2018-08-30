# Deprecated

Deprecation utility for WordPress. Logs a message to notify developers about a deprecated feature.

## Installation

Install the module

```bash
npm install @wordpress/deprecated --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

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

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
