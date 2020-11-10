/**
 * External dependencies
 */
import { isFunction, noop } from 'lodash';

export const createAtomRegistry = ( {
	onAdd = noop,
	onRemove = noop,
} = {} ) => {
	const atoms = new WeakMap();

	return {
		getAtom( atomCreator ) {
			if ( ! atomCreator ) {
				debugger;
			}

			if ( ! atoms.get( atomCreator ) ) {
				const atom = atomCreator( this );
				atoms.set( atomCreator, atom );
				onAdd( atom );
			}

			return atoms.get( atomCreator );
		},

		// This shouldn't be necessary since we rely on week map
		// But the legacy selectors/actions API requires us to know when
		// some atoms are removed entirely to unsubscribe.
		deleteAtom( atomCreator ) {
			const atom = atoms.get( atomCreator );
			atoms.delete( atomCreator );
			onRemove( atom );
		},
	};
};

export const createAtom = ( initialValue ) => () => {
	let value = initialValue;
	let listeners = [];

	return {
		type: 'root',
		set( newValue ) {
			value = newValue;
			listeners.forEach( ( l ) => l() );
		},
		get() {
			return value;
		},
		async resolve() {
			return value;
		},
		subscribe( listener ) {
			listeners.push( listener );
			return () =>
				( listeners = listeners.filter( ( l ) => l !== listener ) );
		},
		isResolved: true,
	};
};

export const createStoreAtom = ( { get, subscribe } ) => () => {
	return {
		type: 'store',
		get() {
			return get();
		},
		subscribe,
		isResolved: true,
	};
};

export const createDerivedAtom = (
	getCallback,
	modifierCallback = noop,
	id
) => ( registry ) => {
	let value = null;
	let listeners = [];
	let isListening = false;
	let isResolved = false;

	const dependenciesUnsubscribeMap = new WeakMap();
	let dependencies = [];

	const notifyListeners = () => {
		listeners.forEach( ( l ) => l() );
	};

	const refresh = () => {
		if ( listeners.length ) {
			resolve();
		} else {
			isListening = false;
		}
	};

	const resolve = async () => {
		const updatedDependencies = [];
		const updatedDependenciesMap = new WeakMap();
		let newValue;
		let didThrow = false;
		try {
			newValue = await getCallback( ( atomCreator ) => {
				const atom = registry.getAtom( atomCreator );
				updatedDependenciesMap.set( atom, true );
				updatedDependencies.push( atom );
				if ( ! atom.isResolved ) {
					throw 'unresolved';
				}
				return atom.get();
			} );
		} catch ( error ) {
			if ( error !== 'unresolved' ) {
				throw error;
			}
			didThrow = true;
		}
		const newDependencies = updatedDependencies.filter(
			( d ) => ! dependenciesUnsubscribeMap.has( d )
		);
		const removedDependencies = dependencies.filter(
			( d ) => ! updatedDependenciesMap.has( d )
		);
		dependencies = updatedDependencies;
		newDependencies.forEach( ( d ) => {
			dependenciesUnsubscribeMap.set( d, d.subscribe( refresh ) );
		} );
		removedDependencies.forEach( ( d ) => {
			const unsubscribe = dependenciesUnsubscribeMap.get( d );
			dependenciesUnsubscribeMap.delete( d );
			if ( unsubscribe ) {
				unsubscribe();
			}
		} );
		if ( ! didThrow && newValue !== value ) {
			value = newValue;
			isResolved = true;
			notifyListeners();
		}
	};

	return {
		id,
		type: 'derived',
		get() {
			return value;
		},
		async set( arg ) {
			await modifierCallback(
				( atomCreator ) => registry.getAtom( atomCreator ).get(),
				( atomCreator ) => registry.getAtom( atomCreator ).set( arg )
			);
		},
		resolve,
		subscribe( listener ) {
			if ( ! isListening ) {
				resolve();
				isListening = true;
			}
			listeners.push( listener );
			return () =>
				( listeners = listeners.filter( ( l ) => l !== listener ) );
		},
		get isResolved() {
			return isResolved;
		},
	};
};
