/**
 * External dependencies
 */
import jQuery from 'jquery';

/**
 * Internal dependencies
 */
import createNonceMiddleware from './nonce-middleware';
import createRootURLMiddleware from './root-url-middleware';
import createPreloadingMiddleware from './preloading-middleware';
import namespaceEndpointMiddleware from './namespace-endpoint-middleware';
import httpV1Middleware from './http-v1-middleware';

const middlewares = [];

function registerMiddleware( middleware ) {
	middlewares.push( middleware );
}

function apiRequest( options ) {
	const raw = ( nextOptions ) => jQuery.ajax( nextOptions );
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

apiRequest.use = registerMiddleware;

apiRequest.createNonceMiddleware = createNonceMiddleware;
apiRequest.createPreloadingMiddleware = createPreloadingMiddleware;
apiRequest.createRootURLMiddleware = createRootURLMiddleware;

export default apiRequest;
