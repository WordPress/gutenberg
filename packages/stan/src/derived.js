/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createQueue } from '@wordpress/priority-queue';

const resolveQueue = createQueue();

/** @typedef {import('./types').WPCommonAtomConfig} WPCommonAtomConfig */
/**
 * @template T
 * @typedef {import("./types").WPDerivedAtomResolver<T>} WPDerivedAtomResolver
 */
/**
 * @template T
 * @typedef {import("./types").WPDerivedAtomUpdater<T>} WPDerivedAtomUpdater
 */
/**
 * @template T
 * @typedef {import("./types").WPAtom<T>} WPAtom
 */
/**
 * @template T
 * @typedef {import("./types").WPAtomState<T>} WPAtomState
 */

/**
 * Creates a derived atom.
 *
 * @template T
 * @param {WPDerivedAtomResolver<T>} resolver Atom resolver.
 * @param {WPDerivedAtomUpdater<T>}  updater  Atom updater.
 * @param {WPCommonAtomConfig=}      config   Common Atom config.
 * @return {WPAtom<T>} Created atom.
 */
export const createDerivedAtom = ( resolver, updater = noop, config = {} ) => (
	registry
) => {
	/**
	 * @type {any}
	 */
	let value = null;

	/**
	 * @type {Set<() => void>}
	 */
	const listeners = new Set();

	/**
	 * @type {(WPAtomState<any>)[]}
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
		if ( listeners.size > 0 ) {
			if ( config.isAsync ) {
				resolveQueue.add( context, resolve );
			} else {
				resolve();
			}
		} else {
			isListening = false;
		}
	};

	/**
	 * @param {WPAtomState<any>} atomState
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
		 * @type {(WPAtomState<any>)[]}
		 */
		const updatedDependencies = [];
		const updatedDependenciesMap = new WeakMap();
		let result;
		const unresolved = [];
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
					const ret = atomState.get();
					if ( ! atomState.isResolved ) {
						unresolved.push( atomState );
					}
					return ret;
				},
			} );
		} catch ( error ) {
			if ( unresolved.length === 0 ) {
				throw error;
			}
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
			if ( unresolved.length === 0 ) {
				isResolved = true;
			}

			if ( unresolved.length === 0 && newValue !== value ) {
				value = newValue;
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
					if ( unresolved.length === 0 ) {
						throw error;
					}
					removeExtraDependencies();
				} );
		} else {
			removeExtraDependencies();
			checkNewValue( result );
		}
	};

	return {
		id: config.id,
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
					get: ( atom ) => registry.get( atom ),
					set: ( atom, arg ) => registry.set( atom, arg ),
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
			listeners.add( listener );
			return () => {
				listeners.delete( listener );
			};
		},
		get isResolved() {
			return isResolved;
		},
	};
};
