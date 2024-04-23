/**
 * Internal dependencies
 */
import { fetchAllMiddleware } from './fetch-all-middleware';
import { namespaceEndpointMiddleware } from './namespace-endpoint';
import { httpV1Middleware } from './http-v1';
import { userLocaleMiddleware } from './user-locale';

/**
 * @type {import('../types').APIFetchMiddleware[]}
 */
export const middlewares = [
	userLocaleMiddleware,
	namespaceEndpointMiddleware,
	httpV1Middleware,
	fetchAllMiddleware,
];

/**
 * Register a middleware
 *
 * @param {import('../types').APIFetchMiddleware} middleware
 */
export function registerMiddleware( middleware ) {
	middlewares.unshift( middleware );
}
