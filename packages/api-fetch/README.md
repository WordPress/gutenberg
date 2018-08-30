# API Fetch

Utility to make WordPress REST API requests. It's a wrapper around `window.fetch`.

## Installation

Install the module

```bash
npm install @wordpress/api-fetch --save
```

_This package assumes that your code will run in an ES5 environment. If you're using an environment that has limited or no support for ES5 such as lower versions of IE then using [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Usage

```js
import apiFetch from '@wordpress/api-fetch';

apiFetch( { path: '/wp/v2/posts' } ).then( posts => {
	console.log( posts );
} );
```

### Middlewares

the `api-fetch` package supports middlewares. Middlewares are functions you can use to wrap the `apiFetch` calls to perform any pre/post process to the API requests.

**Example**

```js
import apiFetch from '@wordpress/api-fetch';

apiFetch.use( ( options, next ) => {
	const start = Date.now();
	const result = next( options );
	result.then( () => {
		console.log( 'The request took ' + Date.now() - start );
	} );
	return result;
} );
```

### Built-in middlewares

The `api-fetch` package provides built-in middlewares you can use to provide a `nonce` and a custom `rootURL`.

**Nonce middleware**

```js
import apiFetch from '@wordpress/api-fetch';

const nonce = "nonce value";
apiFetch.use( apiFetch.createNonceMiddleware( nonce ) );
```

**Root URL middleware**

```js
import apiFetch from '@wordpress/api-fetch';

const rootURL = "http://my-wordpress-site/wp-json/";
apiFetch.use( apiFetch.createRootURLMiddleware( rootURL ) );
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
