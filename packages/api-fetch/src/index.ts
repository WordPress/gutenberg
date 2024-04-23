/**
 * Internal dependencies
 */
import createNonceMiddleware from './middlewares/nonce';
import createRootURLMiddleware from './middlewares/root-url';
import createPreloadingMiddleware from './middlewares/preloading';
import fetchAllMiddleware from './middlewares/fetch-all-middleware';
import mediaUploadMiddleware from './middlewares/media-upload';
import createThemePreviewMiddleware from './middlewares/theme-preview';
import * as ApiFetchCore from './core';
import { type APIFetchOptions } from './types';

export interface ApiFetch {
	< T >( options: APIFetchOptions ): Promise< T >;
	use: typeof ApiFetchCore.registerMiddleware;
	setFetchHandler: typeof ApiFetchCore.setFetchHandler;
	createNonceMiddleware: typeof createNonceMiddleware;
	createPreloadingMiddleware: typeof createPreloadingMiddleware;
	createRootURLMiddleware: typeof createRootURLMiddleware;
	fetchAllMiddleware: typeof fetchAllMiddleware;
	mediaUploadMiddleware: typeof mediaUploadMiddleware;
	createThemePreviewMiddleware: typeof createThemePreviewMiddleware;
}

// @ts-expect-error This is an incomplete type we'll add properties to.
const apiFetch: ApiFetch = ApiFetchCore.apiFetch;

apiFetch.use = ApiFetchCore.registerMiddleware;
apiFetch.setFetchHandler = ApiFetchCore.setFetchHandler;
apiFetch.createNonceMiddleware = createNonceMiddleware;
apiFetch.createPreloadingMiddleware = createPreloadingMiddleware;
apiFetch.createRootURLMiddleware = createRootURLMiddleware;
apiFetch.fetchAllMiddleware = fetchAllMiddleware;
apiFetch.mediaUploadMiddleware = mediaUploadMiddleware;
apiFetch.createThemePreviewMiddleware = createThemePreviewMiddleware;

export { apiFetch as default };
export type { APIFetchOptions };
