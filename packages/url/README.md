# URL

A collection of utilities to manipulate URLs.

## Installation

Install the module

```bash
npm install @wordpress/url --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Usage

```JS
import { isURL, addQueryArgs, prependHTTP } from '@wordpress/url';

// Checks if the argument looks like a URL
const isURL = isURL( 'https://wordpress.org' ); // true

// Appends arguments to the query string of a given url
const newURL = addQueryArgs( 'https://google.com', { q: 'test' } ); // https://google.com/?q=test

// Prepends 'http://' to URLs that are probably mean to have them
const actualURL = prependHTTP( 'wordpress.org' ); // http://wordpress.org

// Gets a single query arg from the given URL.
const foo = getQueryArg( 'https://wordpress.org?foo=bar&bar=baz' ); // bar

// Checks whether a URL contains a given query arg.
const hasBar = hasQueryArg( 'https://wordpress.org?foo=bar&bar=baz', 'bar' ); // true

// Removes one or more query args from the given URL.
const newUrl = removeQueryArgs( 'https://wordpress.org?foo=bar&bar=baz&baz=foobar', 'foo', 'bar' ); // https://wordpress.org?baz=foobar
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
