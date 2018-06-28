/**
 * Internal dependencies
 */
import createNonceMiddleware from './middlewares/nonce';
import createRootURLMiddleware from './middlewares/root-url';
import createPreloadingMiddleware from './middlewares/preloading';
import namespaceEndpointMiddleware from './middlewares/namespace-endpoint';
import httpV1Middleware from './middlewares/http-v1';

const middlewares = [];

function registerMiddleware( middleware ) {
	middlewares.push( middleware );
}

function request( options ) {
	const raw = ( nextOptions ) => {
		const { url, path, body, data, parse = true, ...remainingOptions } = nextOptions;
		const headers = remainingOptions.headers || {};
		if ( ! headers[ 'Content-Type' ] && data ) {
			headers[ 'Content-Type' ] = 'application/json';
		}

		const responsePromise = window.fetch(
			url || path,
			{
				...remainingOptions,
				credentials: 'include',
				body: body || JSON.stringify( data ),
				headers,
			}
		);
		const checkStatus = ( response ) => {
			if ( response.status >= 200 && response.status < 300 ) {
				return response;
			}

			throw response;
		};

		const parseResponse = ( response ) => {
			return parse ? response.json() : response;
		};

		return responsePromise
			.then( checkStatus )
			.then( parseResponse );
	};
	const steps = [
		...middlewares,
		namespaceEndpointMiddleware,
		httpV1Middleware,
		raw,
	].reverse();
	const next = ( nextOptions ) => {
		const nextMiddleware = steps.pop();
		return nextMiddleware( nextOptions, next );
	};

	return next( options );
}

request.use = registerMiddleware;

request.createNonceMiddleware = createNonceMiddleware;
request.createPreloadingMiddleware = createPreloadingMiddleware;
request.createRootURLMiddleware = createRootURLMiddleware;

export default request;
