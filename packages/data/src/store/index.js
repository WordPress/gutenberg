
function createCoreDataStore( registry ) {
	const getCoreDataSelector = ( selectorName ) => ( reducerKey, ...args ) => {
		return registry.select( reducerKey )[ selectorName ]( ...args );
	};

	const getCoreDataAction = ( actionName ) => ( reducerKey, ...args ) => {
		return registry.dispatch( reducerKey )[ actionName ]( ...args );
	};

	return {
		getSelectors() {
			return [
				'getIsResolving',
				'hasStartedResolution',
				'hasFinishedResolution',
				'isResolving',
				'getCachedResolvers',
			].reduce( ( memo, selectorName ) => ( {
				...memo,
				[ selectorName ]: getCoreDataSelector( selectorName ),
			} ), {} );
		},

		getActions() {
			return [
				'startResolution',
				'finishResolution',
				'invalidateResolution',
				'invalidateResolutionForStore',
				'invalidateResolutionForStoreSelector',
			].reduce( ( memo, actionName ) => ( {
				...memo,
				[ actionName ]: getCoreDataAction( actionName ),
			} ), {} );
		},

		subscribe() {
			return () => {};
		},
	};
}

export default createCoreDataStore;
