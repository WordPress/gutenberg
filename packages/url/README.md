# URL

A collection of utilities to manipulate URLs.

## Installation

Install the module

```bash
npm install @wordpress/url --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Usage

### isURL

```js
const isURL = isURL( 'https://wordpress.org' ); // true
```

Checks whether the URL is an HTTP or HTTPS URL.


### getProtocol

```js
const protocol1 = getProtocol( 'tel:012345678' ); // 'tel:'
const protocol2 = getProtocol( 'https://wordpress.org' ); // 'https:'
```

Returns the protocol part of the provided URL.


### isValidProtocol

```js
const isValid = isValidProtocol( 'https:' ); // true
const isNotValid = isValidProtocol( 'https :' ); // false
```

Returns true if the provided protocol is valid. Returns false if the protocol contains invalid characters.


### getAuthority

```js
const authority1 = getAuthority( 'https://wordpress.org/help/' ); // 'wordpress.org'
const authority2 = getAuthority( 'https://localhost:8080/test/' ); // 'localhost:8080'
```

Returns the authority part of the provided URL.


### isValidAuthority

```js
const isValid = isValidAuthority( 'wordpress.org' ); // true
const isNotValid = isValidAuthority( 'wordpress#org' ); // false
```

Returns true if the provided authority is valid. Returns false if the protocol contains invalid characters.


### getPath

```js
const path1 = getPath( 'http://localhost:8080/this/is/a/test?query=true' ); // 'this/is/a/test'
const path2 = getPath( 'https://wordpress.org/help/faq/' ); // 'help/faq'
```

Returns the path part of the provided URL.


### isValidPath

```js
const isValid = isValidPath( 'test/path/' ); // true
const isNotValid = isValidPath( '/invalid?test/path/' ); // false
```

Returns true if the provided path is valid. Returns false if the path contains invalid characters.


### getQueryString

```js
const queryString1 = getQueryString( 'http://localhost:8080/this/is/a/test?query=true#fragment' ); // 'query=true'
const queryString2 = getQueryString( 'https://wordpress.org#fragment?query=false&search=hello' ); // 'query=false&search=hello'
```

Returns the query string part of the provided URL.


### isValidQueryString

```js
const isValid = isValidQueryString( 'query=true&another=false' ); // true
const isNotValid = isValidQueryString( 'query=true?another=false' ); // false
```

Returns true if the provided query string is valid. Returns false if the query string contains invalid characters.


### getFragment

```js
const fragment1 = getFragment( 'http://localhost:8080/this/is/a/test?query=true#fragment' ); // '#fragment'
const fragment2 = getFragment( 'https://wordpress.org#another-fragment?query=true' ); // '#another-fragment'
```

Returns the fragment part of the provided URL.


### isValidFragment

```js
const isValid = isValidFragment( '#valid-fragment' ); // true
const isNotValid = isValidFragment( '#invalid-#fragment' ); // false
```

Returns true if the provided fragment is valid. Returns false if the fragment contains invalid characters.


### addQueryArgs

```js
const newURL = addQueryArgs( 'https://google.com', { q: 'test' } ); // https://google.com/?q=test
```

Adds a query string argument to the provided URL.


### prependHTTP

```js
const actualURL = prependHTTP( 'wordpress.org' ); // http://wordpress.org
```

Prepends the provided partial URL with the http:// protocol.

### getQueryArg

```js
const foo = getQueryArg( 'https://wordpress.org?foo=bar&bar=baz', 'foo' ); // bar
```

Retrieve a query string argument from the provided URL.


### hasQueryArg

```js
const hasBar = hasQueryArg( 'https://wordpress.org?foo=bar&bar=baz', 'bar' ); // true
```

Checks whether a URL contains the given query string argument.


### removeQueryArgs

```js
const newUrl = removeQueryArgs( 'https://wordpress.org?foo=bar&bar=baz&baz=foobar', 'foo', 'bar' ); // https://wordpress.org?baz=foobar
```

Removes one or more query string arguments from the given URL.


### safeDecodeURI

```js
const badUri = safeDecodeURI( '%z' ); // does not throw an Error, simply returns '%z'
```

Safely decodes a URI with `decodeURI`. Returns the URI unmodified if `decodeURI` throws an Error.

### filterURLForDisplay

```js
const displayUrl = filterURLForDisplay( 'https://www.wordpress.org/gutenberg/' ); // wordpress.org/gutenberg
```

Returns a URL for display, without protocol, www subdomain, or trailing slash.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
