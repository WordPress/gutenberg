/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createDerivedAtom,
	createAtomRegistry,
	createStoreAtomSelector,
} from '@wordpress/stan';

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
			// Having a dedicated atom registry per store allow us to support
			// registry inheritance as we won't be retrieving atoms from the wrong registries.
			const atomRegistry = createAtomRegistry();

			// These are used inside of useSelect when mapSelect can merge selectors
			// from different stores and different data registries.
			const registryAtomSelectors = mapValues(
				config.selectors,
				( atomSelector ) => {
					return createStoreAtomSelector(
						( ...args ) => ( listener ) =>
							atomRegistry.subscribe(
								atomSelector( ...args ),
								listener
							),
						( ...args ) => () =>
							atomRegistry.get( atomSelector( ...args ) ),
						( ...args ) => ( value ) =>
							atomRegistry.set( atomSelector( ...args ), value )
					);
				}
			);

			const selectors = mapValues(
				registryAtomSelectors,
				( atomSelector, selectorName ) => {
					return ( /** @type {any[]} **/ ...args ) => {
						return registry.__internalGetAtomResolver()
							? registry.__internalGetAtomResolver()(
									atomSelector( ...args )
							  )
							: atomRegistry.get(
									// @ts-ignore
									config.selectors[ selectorName ]( ...args )
							  );
					};
				}
			);

			const actions = mapValues( config.actions, ( atomAction ) => {
				return ( /** @type {any[]} **/ ...args ) => {
					return atomAction( ...args )( {
						get: ( atomCreator ) => atomRegistry.get( atomCreator ),
						set: ( atomCreator, value ) =>
							atomRegistry.set( atomCreator, value ),
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

					return atomRegistry.subscribe( atom, listener );
				},
			};
		},
	};
}
