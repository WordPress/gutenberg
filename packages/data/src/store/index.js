const coreDataStore = {
	name: 'core/data',
	instantiate( registry ) {
		const getCoreDataSelector =
			( selectorName ) =>
			( key, ...args ) => {
				return registry.select( key )[ selectorName ]( ...args );
			};

		const getCoreDataAction =
			( actionName ) =>
			( key, ...args ) => {
				return registry.dispatch( key )[ actionName ]( ...args );
			};

		const selectors = {
			getIsResolving( key, ...args ) {
				return registry
					.select( key )
					.getIsResolving.apply( null, args );
			},
			hasStartedResolution( key, ...args ) {
				return registry
					.select( key )
					.hasStartedResolution.apply( null, args );
			},
			hasFinishedResolution( key, ...args ) {
				return registry
					.select( key )
					.hasFinishedResolution.apply( null, args );
			},
			isResolving( key, ...args ) {
				return registry.select( key ).isResolving.apply( null, args );
			},
			getCachedResolvers( key, ...args ) {
				return registry
					.select( key )
					.getCachedResolvers.apply( null, args );
			},
		};

		return {
			getSelectors() {
				return selectors;
			},

			getActions() {
				return Object.fromEntries(
					[
						'startResolution',
						'finishResolution',
						'invalidateResolution',
						'invalidateResolutionForStore',
						'invalidateResolutionForStoreSelector',
					].map( ( actionName ) => [
						actionName,
						getCoreDataAction( actionName ),
					] )
				);
			},

			subscribe() {
				// There's no reasons to trigger any listener when we subscribe to this store
				// because there's no state stored in this store that need to retrigger selectors
				// if a change happens, the corresponding store where the tracking stated live
				// would have already triggered a "subscribe" call.
				return () => () => {};
			},
		};
	},
};

export default coreDataStore;
