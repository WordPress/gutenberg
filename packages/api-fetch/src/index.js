/**
 * Internal dependencies
 */
import createNonceMiddleware from './middlewares/nonce';
import createRootURLMiddleware from './middlewares/root-url';
import createPreloadingMiddleware from './middlewares/preloading';
import fetchAllMiddleware from './middlewares/fetch-all-middleware';
import namespaceEndpointMiddleware from './middlewares/namespace-endpoint';
import httpV1Middleware from './middlewares/http-v1';
import userLocaleMiddleware from './middlewares/user-locale';
import mediaUploadMiddleware from './middlewares/media-upload';
import { getFetchHandler, checkStatus, setFetchHandler } from './fetch-handler';

export { setFetchHandler };

const middlewares = [
	userLocaleMiddleware,
	namespaceEndpointMiddleware,
	httpV1Middleware,
	fetchAllMiddleware,
];

function registerMiddleware( middleware ) {
	middlewares.unshift( middleware );
}

function apiFetch( options ) {
	// creates a nested function chain that calls all middlewares and finally the `fetchHandler`,
	// converting `middlewares = [ m1, m2, m3 ]` into:
	// ```
	// opts1 => m1( opts1, opts2 => m2( opts2, opts3 => m3( opts3, fetchHandler ) ) );
	// ```
	const enhancedHandler = middlewares.reduceRight( ( next, middleware ) => {
		return ( workingOptions ) => middleware( workingOptions, next );
	}, getFetchHandler() );

	return enhancedHandler( options ).catch( ( error ) => {
		if ( error.code !== 'rest_cookie_invalid_nonce' ) {
			return Promise.reject( error );
		}

		// If the nonce is invalid, refresh it and try again.
		return window
			.fetch( apiFetch.nonceEndpoint )
			.then( checkStatus )
			.then( ( data ) => data.text() )
			.then( ( text ) => {
				apiFetch.nonceMiddleware.nonce = text;
				return apiFetch( options );
			} );
	} );
}

apiFetch.use = registerMiddleware;
apiFetch.setFetchHandler = setFetchHandler;

apiFetch.createNonceMiddleware = createNonceMiddleware;
apiFetch.createPreloadingMiddleware = createPreloadingMiddleware;
apiFetch.createRootURLMiddleware = createRootURLMiddleware;
apiFetch.fetchAllMiddleware = fetchAllMiddleware;
apiFetch.mediaUploadMiddleware = mediaUploadMiddleware;

export default apiFetch;
