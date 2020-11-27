function nestedGet( map, args ) {
	const len = args.length;
	for ( let i = 0; i < len; i++ ) {
		map = map.get( args[ i ] );
		if ( ! map ) {
			return null;
		}
	}
	return map;
}

function nestedSet( map, args, value ) {
	const nests = args.length - 1;
	for ( let i = 0; i < nests; i++ ) {
		const arg = args[ i ];
		let submap = map.get( arg );
		if ( ! submap ) {
			submap = new Map();
			map.set( arg, submap );
		}
		map = submap;
	}
	map.set( args[ nests ], value );
}

export const createAtomRegistry = () => {
	const atoms = new WeakMap();
	const selectors = new WeakMap();

	const getAtomState = ( atom ) => {
		if ( atom.type === 'selector' ) {
			const { create, args } = atom;
			return getAtomSelector( create, args );
		}

		let atomState = atoms.get( atom );
		if ( ! atomState ) {
			atomState = atom( registry );
			atoms.set( atom, atomState );
		}

		return atomState;
	};

	const getAtomSelector = ( create, args ) => {
		let selectorsMap = selectors.get( create );
		if ( ! selectorsMap ) {
			selectorsMap = new Map();
			selectors.set( create, selectorsMap );
		}

		let value = nestedGet( selectorsMap, args );
		if ( ! value ) {
			const atom = create( ...args );
			value = atom( registry );
			nestedSet( selectorsMap, args, value );
		}

		return value;
	};

	const registry = {
		getAtomState,
		get( atom ) {
			return getAtomState( atom ).get();
		},
	};

	return registry;
};
