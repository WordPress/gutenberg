function createCoreDataStore( registry ) {
	const getCoreDataSelector = ( selectorName ) => ( key, ...args ) => {
		return registry.select( key )[ selectorName ]( ...args );
	};

	const getCoreDataAction = ( actionName ) => ( key, ...args ) => {
		return registry.dispatch( key )[ actionName ]( ...args );
	};

	return {
		getSelectors() {
			return [
				'getIsResolving',
				'hasStartedResolution',
				'hasFinishedResolution',
				'isResolving',
				'getCachedResolvers',
			].reduce(
				( memo, selectorName ) => ( {
					...memo,
					[ selectorName ]: getCoreDataSelector( selectorName ),
				} ),
				{}
			);
		},

		getActions() {
			return [
				'startResolution',
				'finishResolution',
				'invalidateResolution',
				'invalidateResolutionForStore',
				'invalidateResolutionForStoreSelector',
			].reduce(
				( memo, actionName ) => ( {
					...memo,
					[ actionName ]: getCoreDataAction( actionName ),
				} ),
				{}
			);
		},

		subscribe() {
			// There's no reasons to trigger any listener when we subscribe to this store
			// because there's no state stored in this store that need to retrigger selectors
			// if a change happens, the corresponding store where the tracking stated live
			// would have already triggered a "subscribe" call.
			return () => {};
		},
	};
}

export default createCoreDataStore;
