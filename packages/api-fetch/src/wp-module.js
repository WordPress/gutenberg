/**
 * Internal dependencies
 */
import createNonceMiddleware from './middlewares/nonce';
import createRootURLMiddleware from './middlewares/root-url';
import createPreloadingMiddleware from './middlewares/preloading';
import fetchAllMiddleware from './middlewares/fetch-all-middleware';
import mediaUploadMiddleware from './middlewares/media-upload';
import createThemePreviewMiddleware from './middlewares/theme-preview';
import { apiFetch, registerMiddleware, setFetchHandler } from './core';

if ( typeof document !== 'undefined' ) {
	const el = document.getElementById( 'scriptmoduledata_@wordpress/api-fetch' );
	if ( el?.textContent ) {
		console.group( 'api-fetch init' );
		try {
			const config = JSON.parse( el.textContent );

			if ( config.rootURL ) {
				console.log( 'registering createRootURLMiddleware' );
				registerMiddleware( createRootURLMiddleware( config.rootURL ) );
			}
			if ( config.nonce ) {
				console.log( 'registering createNonceMiddleware' );
				registerMiddleware( createNonceMiddleware( config.nonce ) );
			}
			if ( config.shouldRegisterMediaUploadMiddleware ) {
				console.log( 'registering mediaUploadMiddleware' );
				registerMiddleware( mediaUploadMiddleware );
			}
			if ( config.nonceEndpoint ) {
				console.log( 'setting nonceEndpoint' );
				// @ts-expect-error That's how it works
				apiFetch.nonceEndpoint = config.nonceEndpoint;
			}
			if ( config.themePreviewPath ) {
				// @ts-expect-error This is wrong, done for testing.
				registerMiddleware( createThemePreviewMiddleware( config.themePreviewPath ) );
			}
			if ( config.preloadData ) {
				registerMiddleware( createPreloadingMiddleware( config.preloadData ) );
			}

		} catch {
			console.error( 'error' );
		} finally {
			console.groupEnd();
		}
	}
}

export {
	apiFetch,
	registerMiddleware as use,
	setFetchHandler,
	createNonceMiddleware,
	createPreloadingMiddleware,
	createRootURLMiddleware,
	fetchAllMiddleware,
	mediaUploadMiddleware,
	createThemePreviewMiddleware,
};
