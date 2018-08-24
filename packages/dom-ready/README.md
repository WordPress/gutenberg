# DOM Ready

Execute callback after the DOM is loaded.

## Installation

Install the module

```bash
npm install @wordpress/dom-ready --save
```

_This package assumes that your code will run in an ES5 environment. If you're using an environment that has limited or no support for ES5 such as lower versions of IE then using [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

### Usage

```JS
import domReady from '@wordpress/dom-ready';

domReady( function() {
	//do something after DOM loads.
} );
```

## Browser support

See https://make.wordpress.org/design/handbook/design-guide/browser-support/

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
