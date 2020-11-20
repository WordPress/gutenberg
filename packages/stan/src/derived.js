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
	const valueContainer = { value: null };

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

	const notifyListeners = async () =>
		Promise.all( Array.from( listeners ).map( ( l ) => l() ) );

	const refresh = async () => {
		if ( listeners.size > 0 ) {
			if ( config.isAsync ) {
				resolveQueue.add( context, resolve );
			} else {
				await resolve();
			}
		} else {
			isListening = false;
		}
	};

	/**
	 * @param {WPAtomState<any>} atomState
	 */
	const addDependency = async ( atomState ) => {
		if ( ! dependenciesUnsubscribeMap.has( atomState ) ) {
			dependenciesUnsubscribeMap.set(
				atomState,
				await atomState.subscribe( refresh )
			);
		}
	};

	const resolve = async () => {
		/**
		 * @type {(WPAtomState<any>)[]}
		 */
		const updatedDependencies = [];
		const updatedDependenciesMap = new WeakMap();
		const result = await resolver( {
			get: async ( atom ) => {
				const atomState = registry.__unstableGetAtomState( atom );
				// It is important to add the dependency as soon as it's used
				// because it's important to retrigger the resolution if the dependency
				// changes before the resolution finishes.
				await addDependency( atomState );
				updatedDependenciesMap.set( atomState, true );
				updatedDependencies.push( atomState );
				return await atomState.get();
			},
		} );

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
		async function checkNewValue( newValue ) {
			if ( newValue !== valueContainer.value ) {
				valueContainer.value = newValue;
				isResolved = true;
				await notifyListeners();
			}
		}

		removeExtraDependencies();
		await checkNewValue( result );
		return result;
	};

	return {
		id: config.id,
		type: 'derived',
		async get() {
			if ( ! isListening ) {
				isListening = true;
				await resolve();
			}
			return valueContainer.value;
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
		async subscribe( listener ) {
			if ( ! isListening ) {
				isListening = true;
				await resolve();
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
