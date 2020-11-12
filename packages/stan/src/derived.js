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
 * @template T
 * @typedef {(atom: import("./types").WPAtom<T>) => T} WPAtomResolver
 */

/**
 * @template T
 * @typedef {(atom: import("./types").WPAtom<T>, value: any) => void} WPAtomUpdater
 */

/**
 * Creates a derived atom.
 *
 * @template T
 * @param {(resolver: WPAtomResolver<any>) => T}                                 resolver Atom Resolver.
 * @param {(resolver: WPAtomResolver<any>, updater: WPAtomUpdater<any>) => void} updater  Atom updater.
 * @param {boolean=}                                                             isAsync  Atom resolution strategy.
 * @param {string=}                                                              id       Atom id.
 * @return {import("./types").WPAtom<T>}           Createtd atom.
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
	 * @type {(import("./types").WPAtomInstance<any>)[]}
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

	const resolve = () => {
		/**
		 * @type {(import("./types").WPAtomInstance<any>)[]}
		 */
		const updatedDependencies = [];
		const updatedDependenciesMap = new WeakMap();
		let result;
		let didThrow = false;
		try {
			result = resolver( ( atomCreator ) => {
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
			await updater(
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
