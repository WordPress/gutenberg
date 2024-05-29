/** @typedef {import('./registry').WPDataRegistry} WPDataRegistry */

/**
 * Creates a middleware handling resolvers cache invalidation.
 *
 * @param {WPDataRegistry} registry  Registry for which to create the middleware.
 * @param {string}         storeName Name of the store for which to create the middleware.
 *
 * @return {Function} Middleware function.
 */
const createResolversCacheMiddleware =
	( registry, storeName ) => () => ( next ) => ( action ) => {
		const resolvers = registry.select( storeName ).getCachedResolvers();
		const resolverEntries = Object.entries( resolvers );
		resolverEntries.forEach( ( [ selectorName, resolversByArgs ] ) => {
			const resolver =
				registry.stores[ storeName ]?.resolvers?.[ selectorName ];
			if ( ! resolver || ! resolver.shouldInvalidate ) {
				return;
			}
			resolversByArgs.forEach( ( value, args ) => {
				// Works around a bug in `EquivalentKeyMap` where `map.delete` merely sets an entry value
				// to `undefined` and `map.forEach` then iterates also over these orphaned entries.
				if ( value === undefined ) {
					return;
				}

				// resolversByArgs is the map Map([ args ] => boolean) storing the cache resolution status for a given selector.
				// If the value is "finished" or "error" it means this resolver has finished its resolution which means we need
				// to invalidate it, if it's true it means it's inflight and the invalidation is not necessary.
				if ( value.status !== 'finished' && value.status !== 'error' ) {
					return;
				}

				if ( ! resolver.shouldInvalidate( action, ...args ) ) {
					return;
				}

				// Trigger cache invalidation
				registry
					.dispatch( storeName )
					.invalidateResolution( selectorName, args );
			} );
		} );
		return next( action );
	};

export default createResolversCacheMiddleware;
