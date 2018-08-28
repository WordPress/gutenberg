# Token List

Constructable, plain JavaScript [DOMTokenList](https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList) implementation, supporting non-browser runtimes.

## Installation

Install the module

```bash
npm install @wordpress/token-list
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Usage

Construct a new token list, optionally with an initial value. A value with an interface matching DOMTokenList is returned.

```js
import TokenList from '@wordpress/token-list';

const tokens = new TokenList( 'abc def' );
tokens.add( 'ghi' );
tokens.remove( 'def' );
tokens.replace( 'abc', 'xyz' );
console.log( tokens.value );
// "xyz ghi"
```

All [methods of DOMTokenList](https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList#Methods) are implemented.

Note the following implementation divergences from the [specification](https://dom.spec.whatwg.org/#domtokenlist):

- `TokenList#supports` will always return true, regardless of the token passed.
- `TokenList#add` and `TokenList#remove` will simply disregard the empty string argument or whitespace of a token argument, rather than [throwing an error](https://dom.spec.whatwg.org/#dom-domtokenlist-add).
- An item cannot be referenced by its index as a property. Use `TokenList#item` instead.

## Browser Support

While it could be used in one's implementation, this is not intended to serve as a polyfill for `Element#classList` or other instances of `DOMTokenList`.

The implementation of the `DOMTokenList` interface provided through `@wordpress/token-list` is broadly compatible in environments supporting ES5 (IE8 and newer). That being said, due to its internal implementation leveraging arrays for `TokenList#entries`, `TokenList#forEach`, `TokenList#keys`, and `TokenList#values`, you may need to assure that these functions are supported or polyfilled if you intend to use them.

- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/entries#Browser_compatibility
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/values#Browser_compatibility

TokenList's own internal implementation of the `DOMTokenList` interface does not leverage any of these functions, so it is not necessary to polyfill them for basic usage.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
