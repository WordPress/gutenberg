/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import { createDerivedAtom } from '@wordpress/stan';

/**
 * @typedef {import("../types").WPDataAtomicStoreConfig} WPDataAtomicStoreConfig
 */
/**
 * @typedef {import("../types").WPDataStore} WPDataStore
 */
/**
 * @template T
 * @typedef {import('@wordpress/stan/src/types').WPAtom<T>} WPAtom
 */
/**
 * @template T
 * @typedef {import('@wordpress/stan/src/types').WPAtomSelector<T>} WPAtomSelector
 */

/**
 *
 * @param {string}                                     name   Store name.
 * @param {WPDataAtomicStoreConfig} config Atomic store config.
 * @return {WPDataStore} Store.
 */
export default function createAtomicStore( name, config ) {
	return {
		name,
		instantiate: ( registry ) => {
			const selectors = mapValues( config.selectors, ( atomSelector ) => {
				return ( /** @type {any[]} **/ ...args ) => {
					const get = registry.__internalGetAtomResolver()
						? registry.__internalGetAtomResolver()
						: (
								/** @type {WPAtom<any>|WPAtomSelector<any>} **/ atom
						  ) => registry.__internalGetAtomRegistry().get( atom );
					return get( atomSelector( ...args ) );
				};
			} );

			const actions = mapValues( config.actions, ( atomAction ) => {
				return ( /** @type {any[]} **/ ...args ) => {
					return atomAction( ...args )( {
						get: ( atomCreator ) =>
							registry
								.__internalGetAtomRegistry()
								.get( atomCreator ),
						set: ( atomCreator, value ) =>
							registry
								.__internalGetAtomRegistry()
								.set( atomCreator, value ),
					} );
				};
			} );

			return {
				__internalIsAtomic: true,
				getSelectors: () => selectors,
				getActions: () => actions,

				// Subscribing to the root atoms allows us
				// To refresh the data when all root selector change.
				subscribe: ( listener ) => {
					const atom = createDerivedAtom( ( { get } ) => {
						config.rootAtoms.forEach( ( subatom ) =>
							get( subatom )
						);
					} );

					return registry
						.__internalGetAtomRegistry()
						.subscribe( atom, listener );
				},
			};
		},
	};
}
