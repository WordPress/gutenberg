# API Fetch

Utility to make WordPress REST API requests. It's a wrapper around `window.fetch`.

## Installation

Install the module

```bash
npm install @wordpress/api-fetch --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Usage

### GET

```js
import apiFetch from '@wordpress/api-fetch';

apiFetch( { path: '/wp/v2/posts' } ).then( ( posts ) => {
	console.log( posts );
} );
```

### GET with Query Args

```js
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const queryParams = { include: [ 1, 2, 3 ] }; // Return posts with ID = 1,2,3.

apiFetch( { path: addQueryArgs( '/wp/v2/posts', queryParams ) } ).then(
	( posts ) => {
		console.log( posts );
	}
);
```

### POST

```js
apiFetch( {
	path: '/wp/v2/posts/1',
	method: 'POST',
	data: { title: 'New Post Title' },
} ).then( ( res ) => {
	console.log( res );
} );
```

### Options

`apiFetch` supports and passes through all [options of the `fetch` global](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch).

Additionally, the following options are available:

#### `path` (`string`)

Shorthand to be used in place of `url`, appended to the REST API root URL for the current site.

#### `url` (`string`)

Absolute URL to the endpoint from which to fetch.

#### `parse` (`boolean`, default `true`)

Unlike `fetch`, the `Promise` return value of `apiFetch` will resolve to the parsed JSON result. Disable this behavior by passing `parse` as `false`.

#### `data` (`object`)

Sent on `POST` or `PUT` requests only. Shorthand to be used in place of `body`, accepts an object value to be stringified to JSON.

### Aborting a request

Aborting a request can be achieved through the use of [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) in the same way as you would when using the native `fetch` API.

For legacy browsers that don't support `AbortController`, you can either:

-   Provide your own polyfill of `AbortController` if you still want it to be abortable.
-   Ignore it as shown in the example below.

**Example**

```js
const controller =
	typeof AbortController === 'undefined' ? undefined : new AbortController();

apiFetch( { path: '/wp/v2/posts', signal: controller?.signal } ).catch(
	( error ) => {
		// If the browser doesn't support AbortController then the code below will never log.
		// However, in most cases this should be fine as it can be considered to be a progressive enhancement.
		if ( error.name === 'AbortError' ) {
			console.log( 'Request has been aborted' );
		}
	}
);

controller?.abort();
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
		console.log( 'The request took ' + ( Date.now() - start ) + 'ms' );
	} );
	return result;
} );
```

### Built-in middlewares

The `api-fetch` package provides built-in middlewares you can use to provide a `nonce` and a custom `rootURL`.

**Nonce middleware**

```js
import apiFetch from '@wordpress/api-fetch';

const nonce = 'nonce value';
apiFetch.use( apiFetch.createNonceMiddleware( nonce ) );
```

The function returned by `createNonceMiddleware` includes a `nonce` property corresponding to the actively used nonce. You may also assign to this property if you have a fresh nonce value to use.

**Root URL middleware**

```js
import apiFetch from '@wordpress/api-fetch';

const rootURL = 'http://my-wordpress-site/wp-json/';
apiFetch.use( apiFetch.createRootURLMiddleware( rootURL ) );
```

### Custom fetch handler

The `api-fetch` package uses `window.fetch` for making the requests but you can use a custom fetch handler by using the `setFetchHandler` method. The custom fetch handler will receive the `options` passed to the `apiFetch` calls.

**Example**

The example below uses a custom fetch handler for making all the requests with [`axios`](https://github.com/axios/axios).

```js
import apiFetch from '@wordpress/api-fetch';
import axios from 'axios';

apiFetch.setFetchHandler( ( options ) => {
	const { url, path, data, method } = options;

	return axios( {
		url: url || path,
		method,
		data,
	} );
} );
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
