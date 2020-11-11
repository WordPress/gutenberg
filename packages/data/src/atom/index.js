/**
 * External dependencies
 */
import { noop, isObject, isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { createQueue } from '@wordpress/priority-queue';

const resolveQueue = createQueue();

function isPromise( obj ) {
	return isObject( obj ) && isFunction( obj?.then );
}

export const createAtomRegistry = ( {
	onAdd = noop,
	onDelete = noop,
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
			onDelete( atom );
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
	isAsync = false,
	id
) => ( registry ) => {
	let value = null;
	let listeners = [];
	let isListening = false;
	let isResolved = false;
	const context = {};

	const dependenciesUnsubscribeMap = new WeakMap();
	let dependencies = [];

	const notifyListeners = () => {
		listeners.forEach( ( l ) => l() );
	};

	const refresh = () => {
		if ( listeners.length ) {
			if ( isAsync ) {
				resolveQueue.add( context, resolve );
			} else {
				resolve();
			}
		} else {
			isListening = false;
		}
	};

	const resolve = () => {
		const updatedDependencies = [];
		const updatedDependenciesMap = new WeakMap();
		let result;
		let didThrow = false;
		if ( id === 'test-atom' ) {
			// console.log( 'resolve start', didThrow, value );
		}
		try {
			result = getCallback( ( atomCreator ) => {
				const atom = registry.getAtom( atomCreator );
				updatedDependenciesMap.set( atom, true );
				updatedDependencies.push( atom );
				if ( ! atom.isResolved ) {
					throw { type: 'unresolved', id: atom.id };
				}
				return atom.get();
			} );
		} catch ( error ) {
			if ( error?.type !== 'unresolved' ) {
				throw error;
			}
			didThrow = true;
		}

		function syncDependencies() {
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
		}

		function checkNewValue( newValue ) {
			if ( ! didThrow && newValue !== value ) {
				value = newValue;
				isResolved = true;
				notifyListeners();
			}
		}

		if ( isPromise( result ) ) {
			// Should make this promise cancelable.
			result
				.then( ( newValue ) => {
					syncDependencies();
					checkNewValue( newValue );
				} )
				.catch( ( error ) => {
					if ( error?.type !== 'unresolved' ) {
						throw error;
					}
					didThrow = true;
					syncDependencies();
				} );
		} else {
			syncDependencies();
			checkNewValue( result );
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
