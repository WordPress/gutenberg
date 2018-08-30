# Autop

JavaScript port of WordPress's automatic paragraph function `autop` and the `removep` reverse behavior.

## Installation

Install the module

```bash
npm install @wordpress/autop --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

### Usage

Import the desired function(s) from `@wordpress/autop`:

```js
import { autop, removep } from '@wordpress/autop';

autop( 'my text' );
// "<p>my text</p>"

removep( '<p>my text</p>' );
// "my text"
```

### API Usage

* `autop( text: string ): string`
* `removep( text: string ): string`

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
