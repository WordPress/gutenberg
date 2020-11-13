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

	/**
	 * @param {import('./types').WPAtomInstance<any>} atomInstance
	 */
	const addDependency = ( atomInstance ) => {
		if ( ! dependenciesUnsubscribeMap.has( atomInstance ) ) {
			dependenciesUnsubscribeMap.set(
				atomInstance,
				atomInstance.subscribe( refresh )
			);
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
				const atomInstance = registry.getAtom( atomCreator );
				// It is important to add the dependency before the "get" all
				// This allows the resolution to trigger.
				addDependency( atomInstance );
				updatedDependenciesMap.set( atomInstance, true );
				updatedDependencies.push( atomInstance );
				if ( ! atomInstance.isResolved ) {
					throw { type: 'unresolved', id: atomInstance.id };
				}
				return atomInstance.get();
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
			return value;
		},
		async set( action ) {
			await updater(
				( atomCreator ) => {
					return registry.getAtom( atomCreator );
				},
				( atomCreator, arg ) =>
					registry.getAtom( atomCreator ).set( arg ),
				action
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
