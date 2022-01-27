export const META_SELECTORS = [
	'getIsResolving',
	'hasStartedResolution',
	'hasFinishedResolution',
	'isResolving',
	'getCachedResolvers',
];

const META_ACTIONS = [
	'startResolution',
	'finishResolution',
	'invalidateResolution',
	'invalidateResolutionForStore',
	'invalidateResolutionForStoreSelector',
];

const coreDataStore = {
	name: 'core/data',
	instantiate( registry ) {
		const getCoreDataSelector = ( selectorName ) => ( key, ...args ) => {
			return registry.select( key )[ selectorName ]( ...args );
		};

		const getCoreDataAction = ( actionName ) => ( key, ...args ) => {
			return registry.dispatch( key )[ actionName ]( ...args );
		};

		return {
			getSelectors() {
				return Object.fromEntries(
					META_SELECTORS.map( ( selectorName ) => [
						selectorName,
						getCoreDataSelector( selectorName ),
					] )
				);
			},

			getActions() {
				return Object.fromEntries(
					META_ACTIONS.map( ( actionName ) => [
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
