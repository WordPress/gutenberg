/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { STORE_NAME } from './store/name';

/** @typedef {import('./registry').WPDataRegistry} WPDataRegistry */

/**
 * Creates a middleware handling resolvers cache invalidation.
 *
 * @param {WPDataRegistry} registry   The registry reference for which to create
 *                                    the middleware.
 * @param {string}         reducerKey The namespace for which to create the
 *                                    middleware.
 *
 * @return {Function} Middleware function.
 */
const createResolversCacheMiddleware = ( registry, reducerKey ) => () => (
	next
) => ( action ) => {
	const resolvers = registry
		.select( STORE_NAME )
		.getCachedResolvers( reducerKey );
	Object.entries( resolvers ).forEach(
		( [ selectorName, resolversByArgs ] ) => {
			const resolver = get( registry.stores, [
				reducerKey,
				'resolvers',
				selectorName,
			] );
			if ( ! resolver || ! resolver.shouldInvalidate ) {
				return;
			}
			resolversByArgs.forEach( ( value, args ) => {
				// resolversByArgs is the map Map([ args ] => boolean) storing the cache resolution status for a given selector.
				// If the value is false it means this resolver has finished its resolution which means we need to invalidate it,
				// if it's true it means it's inflight and the invalidation is not necessary.
				if (
					value !== false ||
					! resolver.shouldInvalidate( action, ...args )
				) {
					return;
				}

				// Trigger cache invalidation
				registry
					.dispatch( STORE_NAME )
					.invalidateResolution( reducerKey, selectorName, args );
			} );
		}
	);
	return next( action );
};

export default createResolversCacheMiddleware;
