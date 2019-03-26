/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * creates a middleware handling resolvers cache invalidation.
 *
 * @param {Object} registry
 * @param {string} reducerKey
 *
 * @return {function} middleware
 */
const createResolversCacheMiddleware = ( registry, reducerKey ) => () => ( next ) => ( action ) => {
	const resolvers = registry.select( 'core/data' ).getCachedResolvers( reducerKey );
	Object.entries( resolvers ).forEach( ( [ selectorName, resolversByArgs ] ) => {
		const resolver = get( registry.stores, [ reducerKey, 'resolvers', selectorName ] );
		if ( ! resolver || ! resolver.shouldInvalidate ) {
			return;
		}
		resolversByArgs.forEach( ( value, args ) => {
			// resolversByArgs is the map Map([ args ] => boolean) storing the cache resolution status for a given selector.
			// If the value is false it means this resolver has finished its resolution which means we need to invalidate it,
			// if it's true it means it's inflight and the invalidation is not necessary.
			if ( value !== false || ! resolver.shouldInvalidate( action, ...args ) ) {
				return;
			}

			// Trigger cache invalidation
			registry.dispatch( 'core/data' ).invalidateResolution( reducerKey, selectorName, args );
		} );
	} );
	next( action );
};

export default createResolversCacheMiddleware;
