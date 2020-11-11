/**
 * External dependencies
 */
import { noop } from 'lodash';

export const createAtomRegistry = ( {
	onAdd = noop,
	onRemove = noop,
} = {} ) => {
	const atoms = new WeakMap();

	return {
		getAtom( atomCreator ) {
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

export const createAtom = ( initialValue, id ) => () => {
	let value = initialValue;
	let listeners = [];

	return {
		id,
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

export const createStoreAtom = ( { get, subscribe }, id ) => () => {
	let isResolved = false;
	return {
		id,
		type: 'store',
		get() {
			return get();
		},
		subscribe: ( l ) => {
			isResolved = true;
			return subscribe( l );
		},
		get isResolved() {
			return isResolved;
		},
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
		if ( id === 'test-atom' ) {
			// console.log( 'resolve start', didThrow, value );
		}
		try {
			newValue = await getCallback( ( atomCreator ) => {
				const atom = registry.getAtom( atomCreator );
				updatedDependenciesMap.set( atom, true );
				updatedDependencies.push( atom );
				if ( id === 'test-atom' ) {
					// console.log( 'dep', atom.id );
				}
				if ( ! atom.isResolved ) {
					throw { type: 'unresolved', id: atom.id };
				}
				return atom.get();
			} );
		} catch ( error ) {
			if ( error?.type !== 'unresolved' ) {
				throw error;
			}
			if ( id === 'test-atom' ) {
				// console.log( 'error', error );
			}
			didThrow = true;
		}
		if ( id === 'test-atom' ) {
			/*console.log(
				'dependencies',
				updatedDependencies.map( ( atom ) => atom.id )
			);*/
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
