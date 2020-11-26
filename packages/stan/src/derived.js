export const createDerivedAtom = ( resolver ) => ( registry ) => {
	let value = null;
	let isResolved = false;

	const get = ( atom ) => registry.getAtomState( atom ).get();

	return {
		get() {
			if ( ! isResolved ) {
				value = resolver( { get } );
				isResolved = true;
			}
			return value;
		},
	};
};
