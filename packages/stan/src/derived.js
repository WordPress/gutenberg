/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createQueue } from '@wordpress/priority-queue';

const resolveQueue = createQueue();

/**
 * Creates a derived atom.
 *
 * @template T
 * @param {import('./types').WPDerivedAtomResolver<T>} resolver Atom Resolver.
 * @param {import('./types').WPDerivedAtomUpdater}     updater  Atom updater.
 * @param {boolean=}                                   isAsync  Atom resolution strategy.
 * @param {string=}                                    id       Atom id.
 * @return {import("./types").WPAtom<T>} Createtd atom.
 */

export const createDerivedAtom = (
	resolver,
	updater = noop,
	isAsync = false,
	id
) => ( registry ) => {
	/**
	 * @type {any}
	 */
	let value = null;

	/**
	 * @type {(() => void)[]}
	 */
	let listeners = [];

	/**
	 * @type {(import("./types").WPAtomState<any>)[]}
	 */
	let dependencies = [];
	let isListening = false;
	let isResolved = false;
	const context = {};

	const dependenciesUnsubscribeMap = new WeakMap();

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

	/**
	 * @param {import('./types').WPAtomState<any>} atomState
	 */
	const addDependency = ( atomState ) => {
		if ( ! dependenciesUnsubscribeMap.has( atomState ) ) {
			dependenciesUnsubscribeMap.set(
				atomState,
				atomState.subscribe( refresh )
			);
		}
	};

	const resolve = () => {
		/**
		 * @type {(import("./types").WPAtomState<any>)[]}
		 */
		const updatedDependencies = [];
		const updatedDependenciesMap = new WeakMap();
		let result;
		let didThrow = false;
		try {
			result = resolver( {
				get: ( atom ) => {
					const atomState = registry.__unstableGetAtomState( atom );
					// It is important to add the dependency as soon as it's used
					// because it's important to retrigger the resolution if the dependency
					// changes before the resolution finishes.
					addDependency( atomState );
					updatedDependenciesMap.set( atomState, true );
					updatedDependencies.push( atomState );
					if ( ! atomState.isResolved ) {
						throw { type: 'unresolved', id: atomState.id };
					}
					return atomState.get();
				},
			} );
		} catch ( error ) {
			if ( error?.type !== 'unresolved' ) {
				throw error;
			}
			didThrow = true;
		}

		function removeExtraDependencies() {
			const removedDependencies = dependencies.filter(
				( d ) => ! updatedDependenciesMap.has( d )
			);
			dependencies = updatedDependencies;
			removedDependencies.forEach( ( d ) => {
				const unsubscribe = dependenciesUnsubscribeMap.get( d );
				dependenciesUnsubscribeMap.delete( d );
				if ( unsubscribe ) {
					unsubscribe();
				}
			} );
		}

		/**
		 * @param {any} newValue
		 */
		function checkNewValue( newValue ) {
			if ( ! didThrow && newValue !== value ) {
				value = newValue;
				isResolved = true;
				notifyListeners();
			}
		}

		if ( result instanceof Promise ) {
			// Should make this promise cancelable.
			result
				.then( ( newValue ) => {
					removeExtraDependencies();
					checkNewValue( newValue );
				} )
				.catch( ( error ) => {
					if ( error?.type !== 'unresolved' ) {
						throw error;
					}
					didThrow = true;
					removeExtraDependencies();
				} );
		} else {
			removeExtraDependencies();
			checkNewValue( result );
		}
	};

	return {
		id,
		type: 'derived',
		get() {
			if ( ! isListening ) {
				isListening = true;
				resolve();
			}
			return value;
		},
		async set( action ) {
			await updater(
				{
					get: ( atom ) => registry.read( atom ),
					set: ( atom, arg ) => registry.write( atom, arg ),
				},
				action
			);
		},
		resolve,
		subscribe( listener ) {
			if ( ! isListening ) {
				isListening = true;
				resolve();
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
