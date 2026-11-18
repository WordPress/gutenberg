import coreApiFetch, { middlewares } from './api-fetch';
import type { ApiFetch } from './api-fetch';
import fetchAllMiddleware from './middlewares/fetch-all-middleware';

middlewares.push( fetchAllMiddleware );

const apiFetch: ApiFetch = Object.assign( coreApiFetch, {
	fetchAllMiddleware,
} );

export default apiFetch;
export type { ApiFetch };
export type * from './types';
